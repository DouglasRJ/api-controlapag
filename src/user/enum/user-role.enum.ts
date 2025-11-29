export enum USER_ROLE {
  INDIVIDUAL = 'INDIVIDUAL', // Provider independente (sem org)
  MASTER = 'MASTER', // Dono da Organization
  SUB_PROVIDER = 'SUB_PROVIDER', // Funcionário convidado
  CLIENT = 'CLIENT', // Cliente
  PROVIDER = 'PROVIDER', // Manter para compatibilidade (alias de INDIVIDUAL)
}
