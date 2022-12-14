import { Injectable, Inject } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import { WindowRef } from './window-ref';
import { LazyStripeAPILoader, Status } from './api-loader.service';

import { STRIPE_PUBLISHABLE_KEY, StripeJS, STRIPE_OPTIONS } from '../interfaces/stripe';
import { Element } from '../interfaces/element';
import { Elements, ElementsOptions } from '../interfaces/elements';
import {
  SourceData,
  SourceResult,
  isSourceData,
  SourceParams
} from '../interfaces/sources';
import {
  CardDataOptions,
  TokenResult,
  BankAccount,
  BankAccountData,
  PiiData,
  Pii,
  isBankAccount,
  isBankAccountData,
  isPii,
  isPiiData,
} from '../interfaces/token';

@Injectable()
export class StripeService {
  private stripe: StripeJS;

  constructor(
    @Inject(STRIPE_PUBLISHABLE_KEY) private key: string,
    @Inject(STRIPE_OPTIONS) private options: string,
    private loader: LazyStripeAPILoader,
    private window: WindowRef) {
    this.loader.asStream()
      .filter((status: Status) => status.loaded === true)
      .subscribe(() => {
        const Stripe = (this.window.getNativeWindow() as any).Stripe;
        this.stripe = this.options
          ? Stripe(this.key, this.options) as StripeJS
          : Stripe(this.key) as StripeJS;
      });
  }

  public elements(options?: ElementsOptions): Observable<Elements> {
    return this.loader.asStream()
      .filter((status: Status) => status.loaded === true)
      .map(() => this.stripe.elements(options));
  }

  public createToken(
    a: Element | BankAccount | Pii,
    b: CardDataOptions | BankAccountData | PiiData | undefined): Observable<TokenResult> {
    if (isBankAccount(a) && isBankAccountData(b)) {
      return Observable.fromPromise(this.stripe.createToken(a, b));
    } else if (isPii(a) && isPiiData(b)) {
      return Observable.fromPromise(this.stripe.createToken(a, b));
    } else {
      return Observable.fromPromise(this.stripe.createToken(a as Element, b as CardDataOptions | undefined));
    }
  }

  public createSource(a: Element | SourceData, b?: SourceData | undefined): Observable<SourceResult> {
    if (isSourceData(a)) {
      return Observable.fromPromise(this.stripe.createSource(a as SourceData));
    }
    return Observable.fromPromise(this.stripe.createSource(a as Element, b));
  }

  public retrieveSource(source: SourceParams): Observable<SourceResult> {
    return Observable.fromPromise(this.stripe.retrieveSource(source));
  }

}
