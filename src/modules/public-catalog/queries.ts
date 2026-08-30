import { prisma } from "@/db/prisma";
import { resolveLeadSource } from "@/modules/leads/source";

function activePriceWhere(now: Date) {
  return {
    some: {
      startsAt: {
        lte: now
      },
      endsAt: null
    }
  };
}

export async function getDefaultPublicBusiness() {
  return prisma.business.findFirst({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function getPublicCatalog(input: {
  sourceCode?: string | null;
  search?: string | null;
  categorySlug?: string | null;
}) {
  const business = await getDefaultPublicBusiness();

  if (!business) {
    return null;
  }

  const source = await resolveLeadSource({
    businessId: business.id,
    sourceCode: input.sourceCode
  });
  const branchId = source?.branchId ?? undefined;
  const search = input.search?.trim();
  const categorySlug = input.categorySlug?.trim();
  const now = new Date();
  const activePrices = activePriceWhere(now);

  const productAvailabilityWhere = branchId
    ? {
        some: {
          branchId,
          isAvailable: true
        }
      }
    : {
        some: {
          isAvailable: true
        }
      };
  const productSearchWhere = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const
            }
          },
          {
            description: {
              contains: search,
              mode: "insensitive" as const
            }
          },
          {
            category: {
              name: {
                contains: search,
                mode: "insensitive" as const
              }
            }
          }
        ]
      }
    : {};

  const categoryNav = await prisma.productCategory.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      products: {
        some: {
          businessId: business.id,
          isActive: true,
          availability: productAvailabilityWhere,
          prices: activePrices
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true
    },
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        name: "asc"
      }
    ]
  });

  const categories = await prisma.productCategory.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      ...(categorySlug ? { slug: categorySlug } : {}),
      products: {
        some: {
          businessId: business.id,
          isActive: true,
          ...productSearchWhere,
          availability: productAvailabilityWhere,
          prices: activePrices
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      products: {
        where: {
          businessId: business.id,
          isActive: true,
          ...productSearchWhere,
          availability: productAvailabilityWhere,
          prices: activePrices
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          measurementType: true,
          minimumOrderQuantity: true,
          sellingIncrement: true,
          prices: {
            where: {
              startsAt: {
                lte: now
              },
              endsAt: null
            },
            select: {
              priceCents: true,
              basisQuantity: true,
              basisUnit: true
            },
            orderBy: {
              startsAt: "desc"
            },
            take: 1
          }
        },
        orderBy: {
          name: "asc"
        }
      }
    },
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        name: "asc"
      }
    ]
  });

  return {
    business,
    source,
    branchId,
    categoryNav,
    categories
  };
}

export async function getPublicProduct(input: {
  slug: string;
  sourceCode?: string | null;
}) {
  const business = await getDefaultPublicBusiness();

  if (!business) {
    return null;
  }

  const source = await resolveLeadSource({
    businessId: business.id,
    sourceCode: input.sourceCode
  });
  const branchId = source?.branchId ?? undefined;
  const now = new Date();

  const product = await prisma.product.findFirst({
    where: {
      businessId: business.id,
      slug: input.slug,
      isActive: true,
      category: {
        isActive: true
      },
      prices: activePriceWhere(now),
      availability: branchId
        ? {
            some: {
              branchId,
              isAvailable: true
            }
          }
        : {
            some: {
              isAvailable: true
            }
          }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      measurementType: true,
      sellingIncrement: true,
      minimumOrderQuantity: true,
      category: {
        select: {
          name: true
        }
      },
      prices: {
        where: {
          startsAt: {
            lte: now
          },
          endsAt: null
        },
        select: {
          priceCents: true,
          basisQuantity: true,
          basisUnit: true
        },
        orderBy: {
          startsAt: "desc"
        },
        take: 1
      }
    }
  });

  return {
    business,
    source,
    branchId,
    product
  };
}
