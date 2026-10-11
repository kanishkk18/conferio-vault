import "server-only";
import { prisma } from "@securevault/database";

export async function getDashboardStats() {
  const [totalUsers, totalPasswords, totalMedia, storageAgg] = await Promise.all([
    prisma.user.count(),
    prisma.password.count({ where: { deletedAt: null } }),
    prisma.mediaItem.count({ where: { deletedAt: null } }),
    prisma.mediaItem.aggregate({
      where: { deletedAt: null },
      _sum: { fileSize: true },
    }),
  ]);

  return {
    totalUsers,
    totalPasswords,
    totalMedia,
    storageBytes: storageAgg._sum.fileSize ?? 0,
  };
}

export async function getSignupsLast30Days() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  return Array.from(byDay.entries()).map(([date, count]) => ({ date: date.slice(5), count }));
}

export async function getFileTypeDistribution() {
  const groups = await prisma.mediaItem.groupBy({
    by: ["fileType"],
    where: { deletedAt: null },
    _count: { id: true },
  });

  return (groups as Array<{ fileType: string; _count: { id: number } }>).map((g) => ({
    fileType: g.fileType,
    count: g._count.id,
  }));
}
