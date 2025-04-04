import { GetFileListItemDto } from '#data/types/fetch_item_interface'
import { ContentChunk } from '@mistralai/mistralai/models/components/index.js'

export abstract class UploadRepository {
  abstract uploadFile(file: any): Promise<string | Array<ContentChunk> | null | undefined>
  abstract getFileList(): Promise<GetFileListItemDto[]>
}
