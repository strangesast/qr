import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlShortenerService {
  labelElement = null;

  get(id: string) {
    return this.http.get(`/u/${id}.json`);
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

  print(item: {id: string}) {
    const w = window.open(`/print/${item.id}`, 'PRINT');
    w.focus();
    setTimeout(() => w.print(), 1000);
  }


  constructor(public http: HttpClient) {}
}
