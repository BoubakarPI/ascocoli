import { UploadRepository } from '#domain/contracts/repositories/upload_repository'
import { inject } from '@adonisjs/core'

@inject()
export class UploadFileUseCase {
  constructor(private uploadRepository: UploadRepository) {}
  handle(file: any) {
    return this.uploadRepository.uploadFile(file)
  }
}
