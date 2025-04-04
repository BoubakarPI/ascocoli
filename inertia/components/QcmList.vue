<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits(['copy'])

interface QcmInterface {
  id: number
  question: string
  choices: Record<string, string> // Clés dynamiques A, B, C, D...
  correct_answers: string[]
  explanation: string
}

const props = defineProps<{
  qcmData: QcmInterface[]
}>()

const localQcmData = ref<QcmInterface[]>([])

watch(() => props.qcmData, (newVal) => {
  localQcmData.value = newVal
}, { immediate: true })

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(localQcmData.value, null, 2))
    emit('copy', 'Votre code JSON')
  } catch (err) {
    console.error('Failed to copy JSON:', err)
  }
}

const loadJson = (event) => {
  try {
    localQcmData.value = JSON.parse(event.target.value)
  } catch (err) {
    alert('Invalid JSON format')
  }
}
</script>

<template>
  <div class="p-4">
    <!-- Bouton pour copier le JSON -->
    <button @click="copyToClipboard" class="px-4 py-2 bg-primary text-white rounded">
      Copier JSON
    </button>

    <!-- Zone pour insérer un JSON manuellement -->
    <textarea
      class="w-full mt-2 p-2 border rounded"
      rows="5"
      placeholder="Coller votre JSON ici et appuyer sur Entrer..."
      @change="loadJson"
    ></textarea>

    <!-- Liste des QCM -->
    <ul class="mt-4 border p-4 rounded bg-gray-100">
      <li v-for="qcm in localQcmData" :key="qcm.id" class="mb-2 p-2 bg-white rounded shadow">
        <strong>{{ qcm.id }}. {{ qcm.question }}</strong>
        <ul class="ml-4">
          <li v-for="(choice, key) in qcm.choices" :key="key">
            <strong :class="{'text-green-500 font-bold': qcm.correct_answers.includes(key) }">{{ key }}:</strong> {{ choice }}
          </li>
        </ul>
        <p v-if="qcm.explanation"><strong class="font-semibold">Justification</strong> : {{ qcm.explanation }}</p>
      </li>
    </ul>
  </div>
</template>
