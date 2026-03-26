import { PrismaBeneficiaryQueryAdapter } from './prisma-beneficiary-query.adapter';

describe('PrismaBeneficiaryQueryAdapter', () => {
  it('filters listByOwner by visibility and non-deleted by default', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      beneficiary: {
        findMany,
      },
    };

    const adapter = new PrismaBeneficiaryQueryAdapter(prisma as any);

    await adapter.listByOwner({
      ownerUserId: 'user-1',
      offset: 0,
      limit: 50,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        ownerUserId: 'user-1',
        isVisibleToOwner: true,
        isDeleted: false,
      },
      skip: 0,
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('keeps includeDeleted behavior while still enforcing visibility', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      beneficiary: {
        findMany,
      },
    };

    const adapter = new PrismaBeneficiaryQueryAdapter(prisma as any);

    await adapter.listByOwner({
      ownerUserId: 'user-1',
      offset: 5,
      limit: 10,
      includeDeleted: true,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        ownerUserId: 'user-1',
        isVisibleToOwner: true,
      },
      skip: 5,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  });
});
