import { Request } from 'express';
import { config } from '../config/config';
import Logging from '../library/Logging';

interface MatomoTrackParams {
  url: string;
  action_name?: string;
  uid?: string;
  cip?: string;
  ua?: string;
  lang?: string;
  e_c?: string;
  e_a?: string;
  e_n?: string;
  e_v?: number;
  gt_ms?: number;
}

class MatomoService {
  private enabled: boolean;
  private matomoUrl: string;
  private siteId: string;
  private authToken: string;

  constructor() {
    this.enabled = config.matomo.enabled && !!config.matomo.url && !!config.matomo.siteId;
    this.matomoUrl = config.matomo.url;
    this.siteId = config.matomo.siteId;
    this.authToken = config.matomo.authToken;

    // si en el .evn la variable es true, se imprime en pantalla la info
    if (this.enabled) {
      Logging.info(`Matomo tracking initialized. Site ID: ${this.siteId}, URL: ${this.matomoUrl}`);
    } else {
      Logging.warning('Matomo tracking is disabled or not configured in environment variables.');
    }
  }

  // funcion que envia los datos a matomo, solo si en el .env esta en true la variable de ENABLE
  private async sendToMatomo(params: MatomoTrackParams): Promise<void> {
    if (!this.enabled) return;

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('idsite', this.siteId);
      queryParams.append('rec', '1');
      queryParams.append('apiv', '1');

      queryParams.append('url', params.url);

      if (params.action_name) queryParams.append('action_name', params.action_name);
      if (params.uid) queryParams.append('uid', params.uid);

      // Llama a la funcion para ver si la IP es local, de loopback...
      if (params.cip && !this.isLocalOrLoopbackIp(params.cip)) {
        queryParams.append('cip', params.cip);
      }

      if (params.ua) queryParams.append('ua', params.ua);
      if (params.lang) queryParams.append('lang', params.lang);
      if (params.gt_ms !== undefined) queryParams.append('gt_ms', params.gt_ms.toString());

      if (params.e_c) queryParams.append('e_c', params.e_c);
      if (params.e_a) queryParams.append('e_a', params.e_a);
      if (params.e_n) queryParams.append('e_n', params.e_n);
      if (params.e_v !== undefined) queryParams.append('e_v', params.e_v.toString());

      if (this.authToken) {
        queryParams.append('token_auth', this.authToken);
      }

      const trackingEndpoint = `${this.matomoUrl}/matomo.php`;
      Logging.info(`[Matomo] Sending tracking request to: ${trackingEndpoint} with params: ${queryParams.toString()}`);
      Logging.info(
        `[Matomo] Sending tracking request... (action: ${params.action_name || params.e_a || 'Pageview'})`,
      );

      fetch(trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Connection: 'keep-alive'
        },
        body: queryParams.toString()
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            Logging.warning(
              `[Matomo] Server returned status ${response.status} ${response.statusText} - Body: ${errorText}`,
            );
          } else {
            Logging.info(`[Matomo] Tracked successfully!`);
          }
        })
        .catch((err) => {
          Logging.error(`Error sending data to Matomo: ${(err as Error).message}`);
        });
    } catch (error: unknown) {
      Logging.error(`Failed to build Matomo request: ${(error as Error).message}`);
    }
  }

  // Funcion para obtener todos los datos de una peticion del cliente
  private getClientDetails(req: Request & { user?: { id?: string; _id?: string } }) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '';

    const userAgent = req.headers['user-agent'] || '';
    const lang = req.headers['accept-language']?.split(',')[0] || '';
    const userId = req.user?.id || req.user?._id || '';

    const protocol = req.secure ? 'https' : 'http';
    const host = req.headers.host || `localhost:${config.server.port}`;
    const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;

    return { ip, userAgent, lang, userId, fullUrl };
  }

  private isLocalOrLoopbackIp(ip: string): boolean {
    const cleanIp = ip.toLowerCase().trim();
    return (
      cleanIp === '::1' ||
      cleanIp === '127.0.0.1' ||
      cleanIp === 'localhost' ||
      cleanIp.includes('127.0.0.1') ||
      cleanIp.startsWith('192.168.') ||
      cleanIp.startsWith('fe80:') ||
      cleanIp.startsWith('::ffff:127.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)
    );
  }

  public trackRequest(req: Request, durationMs?: number): void {
    const { ip, userAgent, lang, userId, fullUrl } = this.getClientDetails(req);

    const routePath = req.route?.path || req.path;
    const actionName = `[${req.method}] ${routePath}`;

    this.sendToMatomo({
      url: fullUrl,
      action_name: actionName,
      uid: userId || undefined,
      cip: ip,
      ua: userAgent,
      lang: lang,
      gt_ms: durationMs,
    });
  }

  public trackEvent(
    req: Request,
    category: string,
    action: string,
    name?: string,
    value?: number,
  ): void {
    const { ip, userAgent, lang, userId, fullUrl } = this.getClientDetails(req);

    this.sendToMatomo({
      url: fullUrl,
      uid: userId || undefined,
      cip: ip,
      ua: userAgent,
      lang: lang,
      e_c: category,
      e_a: action,
      e_n: name,
      e_v: value,
    });
  }
}

export const matomoService = new MatomoService();
