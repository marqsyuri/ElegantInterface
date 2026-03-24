// NFS-e Municipal payload builder for FocusNFE

export interface Emitente {
  cnpj: string;
  inscricao_municipal: string;
  codigo_municipio: string;
  optante_simples?: boolean;
  regime_tributacao?: string;
}

export interface Tomador {
  cpf?: string;
  cnpj?: string;
  razao_social?: string;
  email?: string;
  fiscal_logradouro?: string;
  fiscal_numero?: string;
  fiscal_complemento?: string;
  fiscal_bairro?: string;
  fiscal_codigo_municipio?: string;
  fiscal_municipio?: string;
  fiscal_uf?: string;
  fiscal_cep?: string;
}

export interface Procedimento {
  name: string;
  item_lista_servico?: string;
  codigo_tributario_municipio?: string;
  codigo_cnae?: string;
  discriminacao_nfse?: string;
  iss_retido?: boolean;
  aliquota_iss?: number;
}

export interface BuildNfsePayloadParams {
  emitente: Emitente;
  tomador: Tomador;
  procedimentos: Procedimento[];
  valorTotal: number;
  dataEmissao: Date;
}

export function buildNfsePayload(params: BuildNfsePayloadParams): any {
  const { emitente, tomador, procedimentos, valorTotal, dataEmissao } = params;

  // Use first procedure's fiscal data as reference, fallback to defaults
  const firstProc = procedimentos[0] || {};
  const itemListaServico = firstProc.item_lista_servico || '0601';
  const codigoTributario = firstProc.codigo_tributario_municipio || '';
  const codigoCnae = firstProc.codigo_cnae || '';
  const issRetido = firstProc.iss_retido ?? false;
  const aliquota = firstProc.aliquota_iss ?? 0.05;

  // Build discriminacao from procedure names + any custom discriminacao
  const discriminacao = procedimentos
    .map(p => p.discriminacao_nfse || p.name)
    .join(', ');

  const payload: any = {
    natureza_operacao: '1',
    optante_simples_nacional: emitente.optante_simples ? 'true' : 'false',
    prestador: {
      cnpj: emitente.cnpj.replace(/\D/g, ''),
      inscricao_municipal: emitente.inscricao_municipal,
      codigo_municipio: emitente.codigo_municipio,
    },
    tomador: {
      razao_social: tomador.razao_social || 'Consumidor Final',
    },
    servico: {
      valor_servicos: valorTotal.toFixed(2),
      iss_retido: issRetido ? 'true' : 'false',
      aliquota: aliquota.toFixed(4),
      item_lista_servico: itemListaServico,
      discriminacao,
      codigo_municipio: emitente.codigo_municipio,
    },
    data_emissao: dataEmissao.toISOString(),
  };

  // Add tomador CPF or CNPJ if available
  if (tomador.cpf) {
    payload.tomador.cpf = tomador.cpf.replace(/\D/g, '');
  } else if (tomador.cnpj) {
    payload.tomador.cnpj = tomador.cnpj.replace(/\D/g, '');
  }

  if (tomador.email) {
    payload.tomador.email = tomador.email;
  }

  // Tomador address
  if (tomador.fiscal_logradouro) {
    payload.tomador.endereco = {
      logradouro: tomador.fiscal_logradouro,
      numero: tomador.fiscal_numero || 'S/N',
      complemento: tomador.fiscal_complemento || '',
      bairro: tomador.fiscal_bairro || '',
      codigo_municipio: tomador.fiscal_codigo_municipio || '',
      uf: tomador.fiscal_uf || '',
      cep: tomador.fiscal_cep ? tomador.fiscal_cep.replace(/\D/g, '') : '',
    };
  }

  // Optional service fields
  if (codigoTributario) {
    payload.servico.codigo_tributario_municipio = codigoTributario;
  }
  if (codigoCnae) {
    payload.servico.codigo_cnae = codigoCnae;
  }

  // Regime tributacao
  if (emitente.regime_tributacao) {
    payload.regime_especial_tributacao = emitente.regime_tributacao;
  }

  return payload;
}
