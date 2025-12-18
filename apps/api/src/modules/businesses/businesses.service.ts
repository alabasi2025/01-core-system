import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBusinessDto, BusinessResponseDto } from './dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(businessId: string): Promise<BusinessResponseDto> {
    const business = await this.prisma.core_businesses.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            stations: true,
            users: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('المجموعة غير موجودة');
    }

    return this.formatBusinessResponse(business);
  }

  async update(businessId: string, dto: UpdateBusinessDto): Promise<BusinessResponseDto> {
    const business = await this.prisma.core_businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('المجموعة غير موجودة');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.logo !== undefined) updateData.logo = dto.logo;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.taxNumber !== undefined) updateData.taxNumber = dto.taxNumber;

    const updatedBusiness = await this.prisma.core_businesses.update({
      where: { id: businessId },
      data: updateData,
      include: {
        _count: {
          select: {
            stations: true,
            users: true,
          },
        },
      },
    });

    return this.formatBusinessResponse(updatedBusiness);
  }

  async getStatistics(businessId: string) {
    const [
      stationsCount,
      usersCount,
      activeUsersCount,
      rolesCount,
      accountsCount,
    ] = await Promise.all([
      this.prisma.core_stations.count({ where: { businessId } }),
      this.prisma.core_users.count({ where: { businessId } }),
      this.prisma.core_users.count({ where: { businessId, isActive: true } }),
      this.prisma.core_roles.count({ where: { businessId } }),
      this.prisma.core_accounts.count({ where: { businessId } }),
    ]);

    return {
      stations: stationsCount,
      users: {
        total: usersCount,
        active: activeUsersCount,
      },
      roles: rolesCount,
      accounts: accountsCount,
    };
  }

  private formatBusinessResponse(business: any): BusinessResponseDto {
    return {
      id: business.id,
      name: business.name,
      nameEn: business.nameEn,
      logo: business.logo,
      address: business.address,
      phone: business.phone,
      email: business.email,
      taxNumber: business.taxNumber,
      isActive: business.isActive,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      stationsCount: business._count?.stations || 0,
      usersCount: business._count?.users || 0,
    };
  }
}
