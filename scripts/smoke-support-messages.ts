import 'dotenv/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

const GRAPHQL_URL = process.env.SMOKE_GRAPHQL_URL ?? 'http://localhost:3001/graphql';

type AuthPayload = {
  accessToken: string;
  user: { id: string; email: string; role: string };
};

async function main(): Promise<void> {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const runId = Date.now();
  const userEmail = `support-user-${runId}@local.test`;
  const adminEmail = `support-admin-${runId}@local.test`;
  const password = 'StrongPass123!';

  const userAuth = await registerUser(userEmail, password, false);
  const adminAuth = await registerUser(adminEmail, password, true, prisma);

  const createdMessage = await graphqlRequest<{ createSupportMessage: any }>({
    token: userAuth.accessToken,
    query: `
      mutation CreateSupportMessage($input: CreateSupportMessageInput!) {
        createSupportMessage(input: $input) {
          id
          authorId
          title
          content
          status
          answer
          answeredById
          answeredAt
          createdAt
        }
      }
    `,
    variables: {
      input: {
        title: 'Problema con transferencia',
        content: 'No veo reflejado el pago en mi remesa.',
      },
    },
  });

  const caseA = createdMessage.createSupportMessage;

  const myList = await graphqlRequest<{ mySupportMessages: any[] }>({
    token: userAuth.accessToken,
    query: `
      query MySupportMessages($input: SupportMessagesPaginationInput) {
        mySupportMessages(input: $input) {
          id
          authorId
          status
          answer
          answeredById
          answeredAt
          createdAt
        }
      }
    `,
    variables: { input: { offset: 0, limit: 10 } },
  });

  const caseB = myList.mySupportMessages.some((item) => item.id === caseA.id);

  const adminList = await graphqlRequest<{ adminSupportMessages: any[] }>({
    token: adminAuth.accessToken,
    query: `
      query AdminSupportMessages($input: SupportMessagesPaginationInput) {
        adminSupportMessages(input: $input) {
          id
          authorId
          status
          answer
          answeredById
          answeredAt
          createdAt
        }
      }
    `,
    variables: { input: { offset: 0, limit: 20 } },
  });

  const caseC = adminList.adminSupportMessages.some((item) => item.id === caseA.id);

  const answered = await graphqlRequest<{ answerSupportMessage: any }>({
    token: adminAuth.accessToken,
    query: `
      mutation AnswerSupportMessage($input: AnswerSupportMessageInput!) {
        answerSupportMessage(input: $input) {
          id
          status
          answer
          answeredById
          answeredAt
        }
      }
    `,
    variables: {
      input: {
        id: caseA.id,
        answer: 'Gracias por reportarlo, ya estamos validando y te avisamos en breve.',
      },
    },
  });

  const caseD = answered.answerSupportMessage;

  const adminByAuthor = await graphqlRequest<{ adminSupportMessagesByAuthor: any[] }>({
    token: adminAuth.accessToken,
    query: `
      query AdminSupportMessagesByAuthor($authorId: ID!, $input: SupportMessagesPaginationInput) {
        adminSupportMessagesByAuthor(authorId: $authorId, input: $input) {
          id
          status
          answer
          answeredById
          answeredAt
        }
      }
    `,
    variables: {
      authorId: userAuth.user.id,
      input: { offset: 0, limit: 10 },
    },
  });

  const reloaded = adminByAuthor.adminSupportMessagesByAuthor.find((item) => item.id === caseA.id);

  const caseE = {
    hasAnswer: typeof reloaded?.answer === 'string' && reloaded.answer.length > 0,
    answeredByIdMatches: reloaded?.answeredById === adminAuth.user.id,
    answeredAtPresent: Boolean(reloaded?.answeredAt),
    statusAnswered: reloaded?.status === 'ANSWERED',
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        graphqlUrl: GRAPHQL_URL,
        caseA_createSupportMessage: {
          id: caseA.id,
          status: caseA.status,
          authorId: caseA.authorId,
        },
        caseB_mySupportMessagesContainsCreated: caseB,
        caseC_adminSupportMessagesContainsCreated: caseC,
        caseD_answerSupportMessage: {
          id: caseD.id,
          status: caseD.status,
          answeredById: caseD.answeredById,
          answeredAt: caseD.answeredAt,
        },
        caseE_requeryAnsweredData: caseE,
      },
      null,
      2,
    ),
  );

  await prisma.onModuleDestroy();
}

async function registerUser(
  email: string,
  password: string,
  asAdmin: boolean,
  prisma?: PrismaService,
): Promise<AuthPayload> {
  const register = await graphqlRequest<{ register: AuthPayload }>({
    query: `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          user {
            id
            email
            role
          }
        }
      }
    `,
    variables: {
      input: {
        email,
        password,
      },
    },
  });

  if (asAdmin && prisma) {
    await prisma.user.update({
      where: { id: register.register.user.id },
      data: {
        roles: {
          set: [Role.ADMIN],
        },
      },
    });

    const login = await graphqlRequest<{ login: AuthPayload }>({
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            accessToken
            user {
              id
              email
              role
            }
          }
        }
      `,
      variables: {
        input: {
          email,
          password,
        },
      },
    });

    return login.login;
  }

  return register.register;
}

async function graphqlRequest<T>(input: {
  query: string;
  variables?: Record<string, unknown>;
  token?: string;
}): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(input.token ? { authorization: `Bearer ${input.token}` } : {}),
    },
    body: JSON.stringify({
      query: input.query,
      variables: input.variables,
    }),
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || json.errors?.length) {
    const errorMessage = json.errors?.map((item) => item.message).join(' | ') || response.statusText;
    throw new Error(`GraphQL request failed: ${errorMessage}`);
  }

  if (!json.data) {
    throw new Error('GraphQL request failed: empty data payload');
  }

  return json.data;
}

main().catch((error) => {
  console.error('Smoke support messages failed:', error);
  process.exitCode = 1;
});
