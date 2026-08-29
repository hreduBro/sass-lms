import {bootstrapApplication} from '@angular/platform-browser';
import {provideZonelessChangeDetection} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {routes} from './src/app.routes';

import {AppComponent} from './src/app.component';
import {
    createInterceptorCondition,
    INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
    IncludeBearerTokenCondition,
    provideKeycloak
} from "keycloak-angular";
import {IdpConfig} from "@/idp.config";

const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: /.*/,
    bearerPrefix: 'Bearer',
});

async function bootstrap() {
    const idpConfig = await IdpConfig.getIdpConfig();
    return bootstrapApplication(AppComponent, {
        providers: [
            provideZonelessChangeDetection(),
            provideKeycloak({
                config: idpConfig,
                initOptions: {
                    onLoad: 'login-required',
                    checkLoginIframe: false,
                },
            }),
            {
                provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
                useValue: [urlCondition],
            },
            provideRouter(routes, withHashLocation()),
            provideHttpClient(),
        ],
    });
}

bootstrap().catch((err) => console.error('Application bootstrap error:', err));

// AI Studio always uses an `index.tsx` file for all project types.