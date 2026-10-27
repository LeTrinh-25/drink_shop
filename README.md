<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Frontend and backend

The project now has a separate React + Vite customer frontend in `frontend/` and
the NestJS backend/API in the repository root. The frontend calls the backend
through `/api`; the Vite development server proxies API and product image requests
to port 3000. The customer storefront, login, cart, and checkout are in React.
Existing EJS admin screens remain available during their migration.

Run the backend and frontend in two terminals:

```bash
# Terminal 1, from the repository root
npm run start:dev

# Terminal 2, from the repository root
npm --prefix frontend install
npm --prefix frontend run dev
```

Open `http://localhost:5173`. The frontend uses the backend session cookie for
login, cart, and checkout. For a separately hosted frontend, set `FRONTEND_URL`
on the backend to its full origin and set `VITE_API_URL` in `frontend/.env` to
the backend origin. HTTPS frontends use a secure cross-site session cookie.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Local Docker run

Docker Compose runs the app and its local PostgreSQL database. The app connects to
the Compose service hostname `db`; `DATABASE_URL` is not passed into the container.

```bash
docker compose up --build -d
docker compose logs -f app
```

Open `http://localhost:3000` to check the app. Stop the containers without deleting
the database volume with:

```bash
docker compose down
```

## Deploy on Render

The root `render.yaml` defines two Render services:

- `drinkshop`: the NestJS API, built from the repository `Dockerfile`.
- `drinkshop-frontend`: the React/Vite static site, built from `frontend/`.

Push the changes to the connected Git repository, then create or update its
Blueprint in Render using `render.yaml`. The frontend is configured to call
`https://drinkshop.onrender.com`; the API allows
`https://drinkshop-frontend.onrender.com` and sets secure session cookies behind
Render's HTTPS proxy. Confirm the API service has these environment values:

- `DATABASE_URL`: the PostgreSQL connection URL for the Render or Supabase database.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD`: the initial admin credentials.
- `SESSION_SECRET`: a long, random secret; the Blueprint generates one for a new service.

Do not set a local Docker hostname such as `db` or `host.docker.internal` as
Render's database host. When using `DATABASE_URL`, remove stale `DB_HOST` values
from the Render service settings so the deployed service has one authoritative
database connection configuration. If you use custom domains, update `FRONTEND_URL`
on the API and `VITE_API_URL` on the frontend, then redeploy both services.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
