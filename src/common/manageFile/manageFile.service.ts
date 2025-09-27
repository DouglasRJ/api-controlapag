export abstract class ManageFileService {
  abstract uploadFile(file: Express.Multer.File, key: string): Promise<string>;
}
