import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlShortenerService {

  get(id: string) {
    return this.http.get(`/u/${id}`);
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

  constructor(public http: HttpClient) {}
}
