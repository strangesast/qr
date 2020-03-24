import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  list() {
    return this.http.get<any[]>('/u/');
  }

  delete(id: string) {
    return this.http.delete(`/u/${id}`);
  }

  constructor(public http: HttpClient) {}
}
