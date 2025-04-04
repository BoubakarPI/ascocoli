import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { UploadFileUseCase } from '#domain/usecases/upload_file_usecase'

@inject()
export default class UploadFileController {
  constructor(private uploadFileUseCase: UploadFileUseCase) {}
  async handle(ctx: HttpContext) {
    const pdf = ctx.request.file('pdf')

    if (!pdf) {
      return ctx.response.badRequest({ error: 'No file uploaded' })
    }
    const response = await this.uploadFileUseCase.handle(pdf)
    console.log(response)
    return ctx.response.json(response)
  }
}
