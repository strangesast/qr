import { Component, OnInit, Input} from '@angular/core';

export const LABEL_COMPONENT_SELECTOR = 'printed-label';

@Component({
  template: `
  <img [src]="link + '.svg'"/>
  <h1>{{title}}</h1>
  <p><a [href]="url">{{url}}</a></p>
  `,
  styles: [
    `
    :host {
      margin: 10px;
      padding: 8px;
      display: grid;
      grid-auto-flow: column;
      align-items: center;
      grid-template-columns: min-content auto;
      grid-template-rows: auto auto;
      box-sizing: border-box;
      outline: 1px solid black;
      width: 600px;
      grid-gap: 8px;
    }
    :host > h1 {
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
      align-self: flex-end;
    }
    :host > p {
      align-self: flex-start;
    }
    :host > img {
      height: 120px;
      grid-row: 1 / 3;
    }
    `
  ],
})
export class LabelComponent implements OnInit {
  @Input()
  link: string;

  @Input()
  url: string;

  @Input()
  title: string;

  constructor() {}

  ngOnInit(): void {
  }
}
