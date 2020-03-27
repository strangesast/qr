import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class UrlShortenerService {
  labelElement = null;

  get(id: string) {
    return this.http.get(`/u/${id}.json`);
  }

  getMany(ids: string[]) {
    return forkJoin(ids.map(id => this.http.get(`/u/${id}.json`)))
  }

  create(url: string, title: string = null) {
    return this.http.post('/u/', {url, title});
  }

  update(doc: Partial<{title: string, url: string, id: string}>) {
    return this.http.put('/u/', doc, {responseType: 'text'}).pipe(mapTo(null));
  }

  list() {
    return this.http.get<any[]>('/u/');
  }

  delete(id: string) {
    return this.http.delete(`/u/${id}`);
  }

  print(item: {id: string}|{id: string}[]) {
    const url = new URL('/print', window.location.origin);
    if (Array.isArray(item)) {
      for (const _item of item) {
        url.searchParams.append('q', _item.id);
      }
    } else {
      url.searchParams.append('q', item.id);
    }
    console.log(url);
    const w = window.open(url.toString(), 'PRINT');
    w.focus();
    // setTimeout(() => w.print(), 1000);
  }

  getQRCode(text: string): Promise<string> {
    return QRCode.toString(text, { errorCorrectionLevel: 'L', type: 'svg' })
      .then(result => this.sanitizer.bypassSecurityTrustHtml(result));
  }

  constructor(
    public sanitizer: DomSanitizer,
    public http: HttpClient,
  ) {}
}
