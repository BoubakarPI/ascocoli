import { GetFileListItemDto } from '#data/types/fetch_item_interface'

export abstract class UploadRepository {
  abstract uploadFile(file: any): Promise<string>
  abstract getFileList(): Promise<GetFileListItemDto[]>
}
