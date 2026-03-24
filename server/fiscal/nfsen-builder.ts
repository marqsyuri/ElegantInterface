// NFS-e Nacional (DPS) payload builder for FocusNFE
// Used when user.nfse_tipo === 'nacional'
// Endpoint: POST /v2/nfsen

import type { Emitente, Tomador, Procedimento } from './nfse-builder';

export interface BuildNfsenPayloadParams {
  emitente: Emitente;
  tomador: Tomador;
  procedimentos: Procedimento[];
  valorTotal: number;
  dataEmissao: Date;
}

export function buildNfsenPayload(params: BuildNfsenPayloadParams): any {
  const { emitente, tomador, procedimentos, valorTotal, dataEmissao } = params;

  const firstProc = procedimentos[0] || {};
  const itemListaServico = firstProc.item_lista_servico || '0601';
  const codigoCnae = firstProc.codigo_cnae || '9602500';
  const issRetido = firstProc.iss_retido ?? false;
  const aliquota = firstProc.aliquota_iss ?? 0.05;

  const discriminacao = procedimentos
    .map(p => p.discriminacao_nfse || p.name)
    .join(', ');

  // DPS structure for NFS-e Nacional
  const payload: any = {
    prestador: {
      cnpj: emitente.cnpj.replace(/\D/g, ''),
      inscricao_municipal: emitente.inscricao_municipal,
      codigo_municipio: emitente.codigo_municipio,
      optante_simples: emitente.optante_simples ?? true,
    },
    tomador: {
      razao_social: tomador.razao_social || 'Consumidor Final',
    },
    serv: {
      comp: discriminacao,
      cListServ: itemListaServico,
      cNBS: '',
      cnae: codigoCnae,
      cMunFG: emitente.codigo_municipio,
    },
    valores: {
      vServPrest: {
        vReceb: valorTotal.toFixed(2),
      },
      trib: {
        totTrib: {
          indTotTrib: '0',
        },
        tribMun: {
          tribISSQN: '1',
          cLocIncid: emitente.codigo_municipio,
          indISSRetido: issRetido ? '1' : '2',
          vBC: valorTotal.toFixed(2),
          pAliq: (aliquota * 100).toFixed(2),
          vISSQN: (valorTotal * aliquota).toFixed(2),
        },
      },
    },
    dCompet: dataEmissao.toISOString().substring(0, 10),
    natureza_operacao: '1',
  };

  // Tomador document
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
    payload.tomador.end = {
      xLgr: tomador.fiscal_logradouro,
      nro: tomador.fiscal_numero || 'S/N',
      xCpl: tomador.fiscal_complemento || '',
      xBairro: tomador.fiscal_bairro || '',
      cMun: tomador.fiscal_codigo_municipio || '',
      uf: tomador.fiscal_uf || '',
      cep: tomador.fiscal_cep ? tomador.fiscal_cep.replace(/\D/g, '') : '',
    };
  }

  return payload;
}
