export interface AdData {
  adId: string;
  adName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  campaignId: string | null;
  campaignName: string | null;
}

export async function fetchAdData(
  sourceId: string,
  accessToken: string,
  adAccountId?: string | null
): Promise<AdData | null> {
  try {
    // Se adAccountId configurado, adicionar effective_status para validar a conta
    const fields = adAccountId
      ? 'name,adset{id,name},campaign{id,name},account_id'
      : 'name,adset{id,name},campaign{id,name}';

    const url = `https://graph.facebook.com/v22.0/${sourceId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.text();
      console.error('[meta-graph] fetchAdData error:', err);
      return null;
    }

    const data = (await res.json()) as {
      id: string;
      name?: string;
      account_id?: string;
      adset?: { id: string; name: string };
      campaign?: { id: string; name: string };
    };

    // Log se conta diferente da configurada (aviso apenas, não bloqueia)
    if (adAccountId && data.account_id) {
      const normalizeAccountId = (id: string) => id.replace(/^act_/, '');
      if (normalizeAccountId(data.account_id) !== normalizeAccountId(adAccountId)) {
        console.warn(
          `[meta-graph] Anúncio ${sourceId} pertence à conta act_${data.account_id}, configurada é ${adAccountId} (usando mesmo assim)`
        );
      }
    }

    return {
      adId: data.id,
      adName: data.name ?? null,
      adsetId: data.adset?.id ?? null,
      adsetName: data.adset?.name ?? null,
      campaignId: data.campaign?.id ?? null,
      campaignName: data.campaign?.name ?? null,
    };
  } catch (err) {
    console.error('[meta-graph] fetchAdData exception:', err);
    return null;
  }
}
