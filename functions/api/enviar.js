/**
 * Recebe os formulários do site (Contato e Ouvidoria) e manda por e-mail.
 *
 * Substitui o Netlify Forms, que ficou para trás na migração para a
 * Cloudflare. Roda como Pages Function: este arquivo vira a rota /api/enviar
 * automaticamente, por causa do caminho functions/api/enviar.js.
 *
 * POR QUE REST API E NÃO O BINDING:
 * a Cloudflare tem um atalho (`env.EMAIL.send`) bem mais simples, mas ele só
 * funciona em Workers — Pages Functions não aceita o binding send_email.
 * Então falamos com a API por HTTP mesmo.
 *
 * POR QUE ISSO É GRATUITO:
 * a Cloudflare só cobra envio para destinatário qualquer. Envio para um
 * endereço verificado da própria conta é livre em qualquer plano e nem entra
 * na cota. Como o formulário só escreve para a caixa do clube (EMAIL_PARA,
 * verificada no painel da Cloudflare), a conta nunca sai do plano grátis.
 * O e-mail de quem escreveu entra como "responder para", então basta o clube
 * apertar Responder — nada é enviado para o visitante por aqui.
 *
 * VARIÁVEIS (painel da Cloudflare > Pages > Settings > Variables and Secrets):
 *   CF_ACCOUNT_ID  id da conta Cloudflare
 *   CF_EMAIL_TOKEN token de API com permissão de envio  ← marcar como Secret
 *   EMAIL_DE       remetente, no domínio do clube (ex.: site@dominio.com.br)
 *   EMAIL_PARA     caixa que recebe, verificada na Cloudflare
 */

// Nomes bonitos para os campos, na ordem em que aparecem no e-mail.
// Campo que chegar e não estiver aqui é mostrado assim mesmo — assim, se um
// formulário ganhar um campo novo no futuro, ele aparece sem precisar mexer aqui.
const ROTULOS = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'Telefone',
  celular: 'Celular/WhatsApp',
  telefone_residencial: 'Telefone residencial',
  matricula: 'Matrícula',
  mensagem: 'Mensagem',
};

const ORIGENS = {
  contato: 'Formulário de Contato',
  ouvidoria: 'Ouvidoria',
};

// Campos de controle: não são conteúdo, não vão para o e-mail.
const IGNORAR = new Set(['bot-field', 'form-name']);

const LIMITE_CORPO = 64 * 1024; // 64 KB é muito mais do que um formulário honesto precisa

function escapar(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Limpa texto que vai virar CABEÇALHO de e-mail (assunto, nome do remetente).
 * Quebra de linha e sinais de maior/menor ali são o jeito clássico de injetar
 * cabeçalho e desviar a mensagem. No corpo do e-mail isso não é problema —
 * só nos cabeçalhos.
 */
function limparCabecalho(s, max = 120) {
  return String(s)
    .replace(/[\r\n<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function responder(dados, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  // ---- 1. Lê o que veio do formulário ----------------------------------
  let campos;
  try {
    const bruto = await request.text();
    if (bruto.length > LIMITE_CORPO) return responder({ ok: false, erro: 'Mensagem grande demais.' }, 413);
    campos = Object.fromEntries(new URLSearchParams(bruto));
  } catch {
    return responder({ ok: false, erro: 'Não foi possível ler o formulário.' }, 400);
  }

  // Armadilha para robô: o campo fica escondido, gente de verdade nunca preenche.
  // Devolvemos sucesso de propósito — se o robô souber que foi barrado, ele tenta de novo.
  if (campos['bot-field']) return responder({ ok: true });

  const origem = ORIGENS[campos['form-name']] || 'Formulário do site';

  // ---- 2. Confere o mínimo ---------------------------------------------
  const mensagem = (campos.mensagem || '').trim();
  const nome = (campos.nome || '').trim();
  if (!nome || !mensagem) {
    return responder({ ok: false, erro: 'Preencha pelo menos o nome e a mensagem.' }, 400);
  }

  const emailVisitante = (campos.email || '').trim();
  const respondePara = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVisitante) ? emailVisitante : null;

  // ---- 3. Confere se a conta está configurada ---------------------------
  // Sem isso o envio falha lá na frente com uma mensagem enigmática.
  const { CF_ACCOUNT_ID, CF_EMAIL_TOKEN, EMAIL_DE, EMAIL_PARA } = env;
  if (!CF_ACCOUNT_ID || !CF_EMAIL_TOKEN || !EMAIL_DE || !EMAIL_PARA) {
    console.error('Envio de e-mail não configurado: falta CF_ACCOUNT_ID, CF_EMAIL_TOKEN, EMAIL_DE ou EMAIL_PARA.');
    return responder({ ok: false, erro: 'O envio está temporariamente indisponível.' }, 503);
  }

  // ---- 4. Monta o e-mail ------------------------------------------------
  const ordem = Object.keys(ROTULOS).filter(k => campos[k] && String(campos[k]).trim());
  const extras = Object.keys(campos).filter(k => !IGNORAR.has(k) && !(k in ROTULOS) && String(campos[k]).trim());
  const linhas = [...ordem, ...extras].map(k => ({
    rotulo: ROTULOS[k] || k,
    valor: String(campos[k]).trim(),
  }));

  const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' });

  const texto = [
    `${origem} — site do Maranhão Atlético Clube`,
    `Recebido em ${quando}`,
    '',
    ...linhas.map(l => `${l.rotulo}: ${l.valor}`),
    '',
    respondePara
      ? `Para responder, basta usar o Responder do seu e-mail (vai para ${respondePara}).`
      : 'Esta pessoa não deixou e-mail — use o telefone informado.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px">
      <h2 style="color:#16357d;margin:0 0 4px">${escapar(origem)}</h2>
      <p style="color:#666;margin:0 0 20px;font-size:14px">Recebido em ${escapar(quando)}</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        ${linhas.map(l => `
        <tr>
          <td style="padding:8px 12px 8px 0;vertical-align:top;color:#666;font-size:14px;white-space:nowrap">${escapar(l.rotulo)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;white-space:pre-wrap">${escapar(l.valor)}</td>
        </tr>`).join('')}
      </table>
      <p style="color:#666;font-size:13px;margin-top:20px">
        ${respondePara
          ? `Para responder, basta apertar Responder — vai direto para ${escapar(respondePara)}.`
          : 'Esta pessoa não deixou e-mail — use o telefone informado.'}
      </p>
    </div>`;

  // ---- 5. Envia ---------------------------------------------------------
  // EMAIL_PARA aceita mais de um endereço separado por vírgula — dá para somar
  // a caixa do marketing depois sem mexer no código. Cada endereço novo precisa
  // ser verificado na Cloudflare, senão o envio deixa de ser gratuito.
  const destinatarios = String(EMAIL_PARA).split(',').map(s => s.trim()).filter(Boolean);

  const nomeCabecalho = limparCabecalho(nome);
  const envio = {
    to: destinatarios.length === 1 ? destinatarios[0] : destinatarios,
    from: { address: EMAIL_DE, name: 'Site do MAC' },
    subject: `[${origem}] ${nomeCabecalho}`,
    text: texto,
    html,
  };
  if (respondePara) envio.reply_to = { address: respondePara, name: nomeCabecalho };

  try {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/email/sending/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_EMAIL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envio),
      },
    );

    if (!resp.ok) {
      // O corpo do erro fica no log da Cloudflare, nunca na tela do visitante:
      // pode conter detalhes da conta.
      console.error('Email Service recusou o envio:', resp.status, await resp.text());
      return responder({ ok: false, erro: 'Não conseguimos enviar sua mensagem agora.' }, 502);
    }

    return responder({ ok: true });
  } catch (e) {
    console.error('Falha de rede ao enviar e-mail:', e);
    return responder({ ok: false, erro: 'Não conseguimos enviar sua mensagem agora.' }, 502);
  }
}

// Quem abrir /api/enviar no navegador cai aqui e recebe uma explicação, em vez
// do erro cru da plataforma. Outros métodos a própria Cloudflare recusa.
export async function onRequestGet() {
  return new Response('Este endereço só recebe envios de formulário.', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}
