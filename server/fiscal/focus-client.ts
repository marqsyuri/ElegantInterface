// FocusNFE HTTP client
// Docs: https://focusnfe.com.br/doc/

function getBaseUrl(ambiente: string): string {
  if (ambiente === 'producao') {
    return 'https://api.focusnfe.com.br';
  }
  return 'https://homologacao.focusnfe.com.br';
}

function getAuthHeader(token: string): string {
  const encoded = Buffer.from(`${token}:`).toString('base64');
  return `Basic ${encoded}`;
}

interface FocusResponse {
  status: number;
  data: any;
}

async function focusRequest(
  method: string,
  path: string,
  token: string,
  ambiente: string,
  body?: any
): Promise<FocusResponse> {
  const baseUrl = getBaseUrl(ambiente);
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Authorization': getAuthHeader(token),
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  let data: any;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

// NFS-e Municipal
export async function enviarNfse(
  token: string,
  ambiente: string,
  ref: string,
  payload: any
): Promise<FocusResponse> {
  return focusRequest('POST', `/v2/nfse?ref=${ref}`, token, ambiente, payload);
}

export async function consultarNfse(
  token: string,
  ambiente: string,
  ref: string
): Promise<FocusResponse> {
  return focusRequest('GET', `/v2/nfse/${ref}`, token, ambiente);
}

export async function cancelarNfse(
  token: string,
  ambiente: string,
  ref: string,
  justificativa: string
): Promise<FocusResponse> {
  return focusRequest('DELETE', `/v2/nfse/${ref}`, token, ambiente, { justificativa });
}

// NFS-e Nacional (DPS)
export async function enviarNfseNacional(
  token: string,
  ambiente: string,
  ref: string,
  payload: any
): Promise<FocusResponse> {
  return focusRequest('POST', `/v2/nfsen?ref=${ref}`, token, ambiente, payload);
}

export async function consultarNfseNacional(
  token: string,
  ambiente: string,
  ref: string
): Promise<FocusResponse> {
  return focusRequest('GET', `/v2/nfsen/${ref}`, token, ambiente);
}

export async function cancelarNfseNacional(
  token: string,
  ambiente: string,
  ref: string,
  justificativa: string
): Promise<FocusResponse> {
  return focusRequest('DELETE', `/v2/nfsen/${ref}`, token, ambiente, { justificativa });
}
