import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const requestTypes = [
  { name: 'Segunda via de certidão', slug: 'segunda-via-certidao' },
  { name: 'Lavratura de escritura', slug: 'lavratura-escritura' },
  { name: 'Reconhecimento de firma', slug: 'reconhecimento-firma' },
  { name: 'Autenticação de documento', slug: 'autenticacao-documento' },
];

async function main() {
  await Promise.all(
    requestTypes.map((type) =>
      prisma.requestType.upsert({ where: { slug: type.slug }, update: type, create: type }),
    ),
  );
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
