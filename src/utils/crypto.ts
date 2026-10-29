/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitários de criptografia e hashing seguros 100% locais no dispositivo (WebCrypto)
 * Garante que nenhuma senha ou resposta secreta seja armazenada em texto simples.
 */

export function gerarSaltAleatorio(tamanho: number = 16): string {
  const bytes = new Uint8Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function gerarHashSeguro(texto: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const dados = enc.encode(`${salt}:${texto}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dados);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verificarHash(texto: string, salt: string, hashEsperado: string): Promise<boolean> {
  const hashCalculado = await gerarHashSeguro(texto, salt);
  return hashCalculado === hashEsperado;
}
