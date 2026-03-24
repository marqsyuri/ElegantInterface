import type { Express } from "express";
import { pool } from "../db";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { buildNfsePayload } from "../fiscal/nfse-builder";
import { buildNfsenPayload } from "../fiscal/nfsen-builder";
import {
  enviarNfse,
  consultarNfse,
  cancelarNfse,
  enviarNfseNacional,
  consultarNfseNacional,
  cancelarNfseNacional,
} from "../fiscal/focus-client";

export function registerFiscalRoutes(app: Express) {

  // POST /api/fiscal/nfse/emitir
  // Emite NFS-e para um agendamento
  app.post('/api/fiscal/nfse/emitir', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { appointment_id, client_id, procedure_ids, valor_total, data_emissao } = req.body;

      if (!valor_total || valor_total <= 0) {
        return res.status(400).json({ message: 'valor_total inválido' });
      }

      // Busca dados fiscais do emitente (salão)
      const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      const emitente = userResult.rows[0];

      if (!emitente) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (!emitente.focusnfe_token) {
        return res.status(400).json({ message: 'Token FocusNFE não configurado. Configure nas configurações fiscais.' });
      }

      if (!emitente.cnpj) {
        return res.status(400).json({ message: 'CNPJ do emitente não configurado.' });
      }

      if (!emitente.inscricao_municipal) {
        return res.status(400).json({ message: 'Inscrição municipal do emitente não configurada.' });
      }

      if (!emitente.codigo_municipio) {
        return res.status(400).json({ message: 'Código do município do emitente não configurado.' });
      }

      // Busca dados do tomador (cliente)
      let tomador: any = {};
      if (client_id) {
        const clientResult = await pool.query(
          'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
          [client_id, userId]
        );
        if (clientResult.rows[0]) {
          tomador = clientResult.rows[0];
        }
      }

      // Busca procedimentos
      let procedimentos: any[] = [];
      if (procedure_ids && procedure_ids.length > 0) {
        const procResult = await pool.query(
          'SELECT * FROM procedures WHERE id = ANY($1) AND user_id = $2',
          [procedure_ids, userId]
        );
        procedimentos = procResult.rows;
      }

      // Se não há procedimentos, usa dados genéricos
      if (procedimentos.length === 0) {
        procedimentos = [{ name: 'Serviços de beleza e estética' }];
      }

      // Gera ref única
      const ref = `sm-${userId}-${Date.now()}`;

      const dataEmissao = data_emissao ? new Date(data_emissao) : new Date();

      // Monta payload
      const emitenteData = {
        cnpj: emitente.cnpj,
        inscricao_municipal: emitente.inscricao_municipal,
        codigo_municipio: emitente.codigo_municipio,
        optante_simples: emitente.optante_simples ?? true,
        regime_tributacao: emitente.regime_tributacao || '6',
      };

      let payload: any;
      const nfseTipo = emitente.nfse_tipo || 'municipal';

      if (nfseTipo === 'nacional') {
        payload = buildNfsenPayload({
          emitente: emitenteData,
          tomador,
          procedimentos,
          valorTotal: parseFloat(valor_total),
          dataEmissao,
        });
      } else {
        payload = buildNfsePayload({
          emitente: emitenteData,
          tomador,
          procedimentos,
          valorTotal: parseFloat(valor_total),
          dataEmissao,
        });
      }

      // Salva nota no DB com status 'processando'
      const insertResult = await pool.query(
        `INSERT INTO fiscal_notes
          (user_id, appointment_id, ref, tipo, status, tentativas, payload_enviado, valor_total, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          appointment_id || null,
          ref,
          'nfse',
          'processando',
          1,
          JSON.stringify(payload),
          parseFloat(valor_total),
        ]
      );
      const nota = insertResult.rows[0];

      // Envia para FocusNFE
      let focusResult: any;
      try {
        if (nfseTipo === 'nacional') {
          focusResult = await enviarNfseNacional(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref, payload);
        } else {
          focusResult = await enviarNfse(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref, payload);
        }
      } catch (fetchError: any) {
        await pool.query(
          `UPDATE fiscal_notes SET status = $1, mensagem_erro = $2, updated_at = NOW() WHERE ref = $3`,
          ['erro', `Falha na comunicação: ${fetchError.message}`, ref]
        );
        return res.status(502).json({ message: 'Erro ao comunicar com FocusNFE', error: fetchError.message });
      }

      // Atualiza status baseado na resposta
      let novoStatus = 'processando';
      let mensagemErro: string | null = null;

      if (focusResult.status === 200 || focusResult.status === 201) {
        const d = focusResult.data;
        if (d.status === 'autorizado') {
          novoStatus = 'autorizado';
        } else if (d.status === 'erro' || d.status === 'negado') {
          novoStatus = 'erro';
          mensagemErro = JSON.stringify(d.erros || d.mensagem_sefaz || d);
        } else {
          novoStatus = d.status || 'processando';
        }

        await pool.query(
          `UPDATE fiscal_notes SET
            status = $1,
            mensagem_erro = $2,
            numero_nota = $3,
            serie_nota = $4,
            chave_acesso = $5,
            xml_url = $6,
            pdf_url = $7,
            emitido_em = $8,
            updated_at = NOW()
           WHERE ref = $9`,
          [
            novoStatus,
            mensagemErro,
            d.numero || d.numero_nfse || null,
            d.serie || null,
            d.chave_nfe || d.codigo_verificacao || null,
            d.caminho_xml_nota_fiscal || null,
            d.caminho_danfe || d.caminho_pdf || null,
            novoStatus === 'autorizado' ? new Date() : null,
            ref,
          ]
        );
      } else {
        novoStatus = 'erro';
        mensagemErro = JSON.stringify(focusResult.data);
        await pool.query(
          `UPDATE fiscal_notes SET status = $1, mensagem_erro = $2, updated_at = NOW() WHERE ref = $3`,
          [novoStatus, mensagemErro, ref]
        );
      }

      const finalResult = await pool.query('SELECT * FROM fiscal_notes WHERE ref = $1', [ref]);
      return res.status(201).json(finalResult.rows[0]);

    } catch (error: any) {
      console.error('[fiscal] Erro ao emitir NFS-e:', error);
      return res.status(500).json({ message: 'Erro interno ao emitir nota fiscal', error: error.message });
    }
  });

  // GET /api/fiscal/nfse/:ref/status
  app.get('/api/fiscal/nfse/:ref/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { ref } = req.params;

      const notaResult = await pool.query(
        'SELECT * FROM fiscal_notes WHERE ref = $1 AND user_id = $2',
        [ref, userId]
      );

      if (notaResult.rows.length === 0) {
        return res.status(404).json({ message: 'Nota fiscal não encontrada' });
      }

      const nota = notaResult.rows[0];

      // Se ainda processando, consulta na FocusNFE
      if (nota.status === 'processando' || nota.status === 'em_processamento') {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const emitente = userResult.rows[0];

        if (emitente && emitente.focusnfe_token) {
          let focusResult: any;
          try {
            const nfseTipo = emitente.nfse_tipo || 'municipal';
            if (nfseTipo === 'nacional') {
              focusResult = await consultarNfseNacional(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref);
            } else {
              focusResult = await consultarNfse(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref);
            }

            if (focusResult.status === 200) {
              const d = focusResult.data;
              let novoStatus = d.status || nota.status;
              let mensagemErro: string | null = null;

              if (d.status === 'erro' || d.status === 'negado') {
                mensagemErro = JSON.stringify(d.erros || d.mensagem_sefaz || d);
              }

              await pool.query(
                `UPDATE fiscal_notes SET
                  status = $1,
                  mensagem_erro = $2,
                  numero_nota = $3,
                  serie_nota = $4,
                  chave_acesso = $5,
                  xml_url = $6,
                  pdf_url = $7,
                  emitido_em = $8,
                  updated_at = NOW()
                 WHERE ref = $9`,
                [
                  novoStatus,
                  mensagemErro,
                  d.numero || d.numero_nfse || nota.numero_nota,
                  d.serie || nota.serie_nota,
                  d.chave_nfe || d.codigo_verificacao || nota.chave_acesso,
                  d.caminho_xml_nota_fiscal || nota.xml_url,
                  d.caminho_danfe || d.caminho_pdf || nota.pdf_url,
                  novoStatus === 'autorizado' ? new Date() : nota.emitido_em,
                  ref,
                ]
              );
            }
          } catch (e) {
            // Se falha ao consultar, retorna o que temos no DB
          }
        }
      }

      const finalResult = await pool.query('SELECT * FROM fiscal_notes WHERE ref = $1', [ref]);
      return res.json(finalResult.rows[0]);

    } catch (error: any) {
      console.error('[fiscal] Erro ao consultar status:', error);
      return res.status(500).json({ message: 'Erro ao consultar status da nota', error: error.message });
    }
  });

  // DELETE /api/fiscal/nfse/:ref/cancelar
  app.delete('/api/fiscal/nfse/:ref/cancelar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { ref } = req.params;
      const { justificativa } = req.body;

      if (!justificativa || justificativa.length < 15) {
        return res.status(400).json({ message: 'Justificativa deve ter no mínimo 15 caracteres' });
      }

      const notaResult = await pool.query(
        'SELECT * FROM fiscal_notes WHERE ref = $1 AND user_id = $2',
        [ref, userId]
      );

      if (notaResult.rows.length === 0) {
        return res.status(404).json({ message: 'Nota fiscal não encontrada' });
      }

      const nota = notaResult.rows[0];

      if (nota.status === 'cancelado') {
        return res.status(400).json({ message: 'Nota já está cancelada' });
      }

      if (nota.status !== 'autorizado') {
        return res.status(400).json({ message: 'Somente notas autorizadas podem ser canceladas' });
      }

      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      const emitente = userResult.rows[0];

      if (!emitente || !emitente.focusnfe_token) {
        return res.status(400).json({ message: 'Token FocusNFE não configurado' });
      }

      let focusResult: any;
      const nfseTipo = emitente.nfse_tipo || 'municipal';

      if (nfseTipo === 'nacional') {
        focusResult = await cancelarNfseNacional(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref, justificativa);
      } else {
        focusResult = await cancelarNfse(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref, justificativa);
      }

      if (focusResult.status === 200 || focusResult.status === 204) {
        await pool.query(
          `UPDATE fiscal_notes SET status = 'cancelado', cancelado_em = NOW(), updated_at = NOW() WHERE ref = $1`,
          [ref]
        );
        const finalResult = await pool.query('SELECT * FROM fiscal_notes WHERE ref = $1', [ref]);
        return res.json(finalResult.rows[0]);
      } else {
        return res.status(400).json({
          message: 'Erro ao cancelar nota na FocusNFE',
          error: focusResult.data,
        });
      }

    } catch (error: any) {
      console.error('[fiscal] Erro ao cancelar NFS-e:', error);
      return res.status(500).json({ message: 'Erro ao cancelar nota fiscal', error: error.message });
    }
  });

  // GET /api/fiscal/notes
  app.get('/api/fiscal/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { startDate, endDate, status, tipo, page = '1' } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limit = 20;
      const offset = (pageNum - 1) * limit;

      const conditions: string[] = ['user_id = $1'];
      const values: any[] = [userId];
      let paramIdx = 2;

      if (startDate) {
        conditions.push(`created_at >= $${paramIdx}`);
        values.push(new Date(startDate as string));
        paramIdx++;
      }

      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        conditions.push(`created_at <= $${paramIdx}`);
        values.push(end);
        paramIdx++;
      }

      if (status) {
        conditions.push(`status = $${paramIdx}`);
        values.push(status);
        paramIdx++;
      }

      if (tipo) {
        conditions.push(`tipo = $${paramIdx}`);
        values.push(tipo);
        paramIdx++;
      }

      const where = conditions.join(' AND ');

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM fiscal_notes WHERE ${where}`,
        values
      );
      const total = parseInt(countResult.rows[0].count);

      const notesResult = await pool.query(
        `SELECT * FROM fiscal_notes WHERE ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...values, limit, offset]
      );

      return res.json({
        notes: notesResult.rows,
        total,
        page: pageNum,
        pages: Math.ceil(total / limit),
      });

    } catch (error: any) {
      console.error('[fiscal] Erro ao listar notas:', error);
      return res.status(500).json({ message: 'Erro ao listar notas fiscais', error: error.message });
    }
  });

  // POST /api/fiscal/webhook
  // Público — callback da FocusNFE (sem autenticação)
  app.post('/api/fiscal/webhook', async (req: any, res) => {
    try {
      const { ref, status, cnpj_emitente } = req.body;

      if (!ref) {
        return res.status(400).json({ message: 'ref obrigatório' });
      }

      console.log('[fiscal webhook] recebido:', { ref, status, cnpj_emitente });

      const notaResult = await pool.query(
        'SELECT * FROM fiscal_notes WHERE ref = $1',
        [ref]
      );

      if (notaResult.rows.length === 0) {
        // Não encontrado, mas responde OK para a FocusNFE não retentar
        return res.status(200).json({ message: 'ok' });
      }

      const nota = notaResult.rows[0];

      // Busca emitente para obter token e consultar detalhes
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [nota.user_id]);
      const emitente = userResult.rows[0];

      if (emitente && emitente.focusnfe_token) {
        let focusResult: any;
        const nfseTipo = emitente.nfse_tipo || 'municipal';

        try {
          if (nfseTipo === 'nacional') {
            focusResult = await consultarNfseNacional(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref);
          } else {
            focusResult = await consultarNfse(emitente.focusnfe_token, emitente.focusnfe_ambiente || 'homologacao', ref);
          }

          if (focusResult && focusResult.status === 200) {
            const d = focusResult.data;
            const novoStatus = d.status || status || nota.status;
            const mensagemErro = (d.status === 'erro' || d.status === 'negado')
              ? JSON.stringify(d.erros || d.mensagem_sefaz || d)
              : null;

            await pool.query(
              `UPDATE fiscal_notes SET
                status = $1,
                mensagem_erro = $2,
                numero_nota = $3,
                serie_nota = $4,
                chave_acesso = $5,
                xml_url = $6,
                pdf_url = $7,
                emitido_em = $8,
                updated_at = NOW()
               WHERE ref = $9`,
              [
                novoStatus,
                mensagemErro,
                d.numero || d.numero_nfse || nota.numero_nota,
                d.serie || nota.serie_nota,
                d.chave_nfe || d.codigo_verificacao || nota.chave_acesso,
                d.caminho_xml_nota_fiscal || nota.xml_url,
                d.caminho_danfe || d.caminho_pdf || nota.pdf_url,
                novoStatus === 'autorizado' ? new Date() : nota.emitido_em,
                ref,
              ]
            );
          }
        } catch (e) {
          // Apenas loga, webhook deve retornar 200
          console.error('[fiscal webhook] erro ao consultar FocusNFE:', e);
        }
      }

      return res.status(200).json({ message: 'ok' });

    } catch (error: any) {
      console.error('[fiscal webhook] erro:', error);
      // Retorna 200 mesmo em erro para não causar retentativas infinitas
      return res.status(200).json({ message: 'ok' });
    }
  });
}
