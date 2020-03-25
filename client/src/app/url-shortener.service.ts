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

  print(item: {title: string, link: string}) {
    const w = window.open('', 'PRINT'); // , 'height=300,width=600');
    w.document.write(`
    <html>
    <head>
      <title>Label</title>
      <style>
      body {
        margin: 10px;
        display: grid;
        grid-auto-flow: column;
        align-items: center;
        grid-template-columns: min-content auto;
        box-sizing: border-box;
        outline: 1px solid black;
        width: 400px;
        height: 120px;
      }
      body > h1 {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      </style>
    </head>
    <body>
      <img width="120" height="120" src="${item.link}.svg"/>
      <h1>${item.title}</h1>
    </body>
    </html>
      `);
    w.document.close();
    w.focus();
    w.print();
  }


  constructor(public http: HttpClient) {}
}
