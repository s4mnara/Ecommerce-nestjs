export class CreateLogDto {
  usuarioId?: string;
  usuario?: string;
  acao!: string; // obrigatório
  meta?: any;
}
