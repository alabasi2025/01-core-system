import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto, StationResponseDto, PaginatedStationsDto, StationType, StationStatisticsDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateStationDto): Promise<StationResponseDto> {
    // Check if station name already exists for this business
    const existingStation = await this.prisma.core_stations.findFirst({
      where: { businessId, name: dto.name },
    });

    if (existingStation) {
      throw new ConflictException('اسم المحطة مستخدم بالفعل');
    }

    // Check code uniqueness if provided
    if (dto.code) {
      const existingCode = await this.prisma.core_stations.findFirst({
        where: { businessId, code: dto.code },
      });
      if (existingCode) {
        throw new ConflictException('رمز المحطة مستخدم بالفعل');
      }
    }

    // Validate parent station if provided
    let level = 1;
    if (dto.parentId) {
      const parentStation = await this.prisma.core_stations.findFirst({
        where: { id: dto.parentId, businessId },
      });
      if (!parentStation) {
        throw new BadRequestException('المحطة الأم غير موجودة');
      }
      level = (parentStation.level || 1) + 1;
    }

    const station = await this.prisma.core_stations.create({
      data: {
        businessId,
        parentId: dto.parentId,
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        type: dto.type || 'generation_distribution',
        level,
        location: dto.location,
        address: dto.address,
        latitude: dto.latitude ? new Decimal(dto.latitude) : null,
        longitude: dto.longitude ? new Decimal(dto.longitude) : null,
        hasGenerators: dto.hasGenerators || false,
        hasSolar: dto.hasSolar || false,
        generatorCapacity: dto.generatorCapacity ? new Decimal(dto.generatorCapacity) : null,
        solarCapacity: dto.solarCapacity ? new Decimal(dto.solarCapacity) : null,
        managerName: dto.managerName,
        managerPhone: dto.managerPhone,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        workingHours: dto.workingHours,
      },
      include: {
        parent: true,
        _count: { select: { children: true, stationUsers: true, journalEntries: true } },
      },
    });

    return this.formatStationResponse(station);
  }

  async findAll(businessId: string, query: StationQueryDto): Promise<PaginatedStationsDto> {
    const { search, type, isActive, parentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { managerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }

    const [stations, total] = await Promise.all([
      this.prisma.core_stations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: true,
          _count: { select: { children: true, stationUsers: true, journalEntries: true } },
        },
      }),
      this.prisma.core_stations.count({ where }),
    ]);

    return {
      data: stations.map((station) => this.formatStationResponse(station)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(businessId: string, id: string): Promise<StationResponseDto> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id, businessId },
      include: {
        parent: true,
        children: true,
        _count: { select: { children: true, stationUsers: true, journalEntries: true } },
      },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    return this.formatStationResponse(station);
  }

  async getStationsTree(businessId: string): Promise<any[]> {
    const stations = await this.prisma.core_stations.findMany({
      where: { businessId, parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
        _count: { select: { stationUsers: true, journalEntries: true } },
      },
      orderBy: { name: 'asc' },
    });

    return stations.map((station) => this.formatTreeNode(station));
  }

  async getChildren(businessId: string, parentId: string): Promise<StationResponseDto[]> {
    const stations = await this.prisma.core_stations.findMany({
      where: { businessId, parentId },
      include: {
        _count: { select: { children: true, stationUsers: true, journalEntries: true } },
      },
      orderBy: { name: 'asc' },
    });

    return stations.map((station) => this.formatStationResponse(station));
  }

  async getStationUsers(businessId: string, stationId: string): Promise<any[]> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id: stationId, businessId },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    const stationUsers = await this.prisma.core_station_users.findMany({
      where: { stationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stationUsers.map((su) => ({
      id: su.id,
      userId: su.userId,
      stationId: su.stationId,
      role: su.role,
      isPrimary: su.isPrimary,
      createdAt: su.createdAt,
      user: su.user,
    }));
  }

  async addUserToStation(
    businessId: string,
    stationId: string,
    userId: string,
    role?: string,
    isPrimary?: boolean,
  ): Promise<any> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id: stationId, businessId },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    const user = await this.prisma.core_users.findFirst({
      where: { id: userId, businessId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Check if already assigned
    const existing = await this.prisma.core_station_users.findFirst({
      where: { stationId, userId },
    });

    if (existing) {
      throw new ConflictException('المستخدم مضاف للمحطة بالفعل');
    }

    // If isPrimary, remove primary from other stations
    if (isPrimary) {
      await this.prisma.core_station_users.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const stationUser = await this.prisma.core_station_users.create({
      data: {
        stationId,
        userId,
        role,
        isPrimary: isPrimary || false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update user's scopeIds if scopeType is station
    if (user.scopeType === 'station') {
      const currentScopeIds = Array.isArray(user.scopeIds) ? user.scopeIds : [];
      if (!currentScopeIds.includes(stationId)) {
        await this.prisma.core_users.update({
          where: { id: userId },
          data: { scopeIds: [...currentScopeIds, stationId] },
        });
      }
    }

    return {
      id: stationUser.id,
      stationId: stationUser.stationId,
      userId: stationUser.userId,
      role: stationUser.role,
      isPrimary: stationUser.isPrimary,
      user: stationUser.user,
    };
  }

  async removeUserFromStation(
    businessId: string,
    stationId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id: stationId, businessId },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    const stationUser = await this.prisma.core_station_users.findFirst({
      where: { stationId, userId },
    });

    if (!stationUser) {
      throw new NotFoundException('المستخدم غير مضاف لهذه المحطة');
    }

    await this.prisma.core_station_users.delete({
      where: { id: stationUser.id },
    });

    // Update user's scopeIds
    const user = await this.prisma.core_users.findUnique({
      where: { id: userId },
    });

    if (user && user.scopeType === 'station') {
      const currentScopeIds = Array.isArray(user.scopeIds) ? user.scopeIds : [];
      const newScopeIds = currentScopeIds.filter((id) => id !== stationId);
      await this.prisma.core_users.update({
        where: { id: userId },
        data: { scopeIds: newScopeIds },
      });
    }

    return { message: 'تم إزالة المستخدم من المحطة بنجاح' };
  }

  async update(businessId: string, id: string, dto: UpdateStationDto): Promise<StationResponseDto> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id, businessId },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    // Check name uniqueness if changed
    if (dto.name && dto.name !== station.name) {
      const existingStation = await this.prisma.core_stations.findFirst({
        where: { businessId, name: dto.name, id: { not: id } },
      });
      if (existingStation) {
        throw new ConflictException('اسم المحطة مستخدم بالفعل');
      }
    }

    // Check code uniqueness if changed
    if (dto.code && dto.code !== station.code) {
      const existingCode = await this.prisma.core_stations.findFirst({
        where: { businessId, code: dto.code, id: { not: id } },
      });
      if (existingCode) {
        throw new ConflictException('رمز المحطة مستخدم بالفعل');
      }
    }

    // Validate parent change
    let level = station.level;
    if (dto.parentId !== undefined && dto.parentId !== station.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('لا يمكن تعيين المحطة كأم لنفسها');
      }
      if (dto.parentId) {
        const parentStation = await this.prisma.core_stations.findFirst({
          where: { id: dto.parentId, businessId },
        });
        if (!parentStation) {
          throw new BadRequestException('المحطة الأم غير موجودة');
        }
        level = (parentStation.level || 1) + 1;
      } else {
        level = 1;
      }
    }

    const updateData: any = { level };
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId || null;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude ? new Decimal(dto.latitude) : null;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude ? new Decimal(dto.longitude) : null;
    if (dto.hasGenerators !== undefined) updateData.hasGenerators = dto.hasGenerators;
    if (dto.hasSolar !== undefined) updateData.hasSolar = dto.hasSolar;
    if (dto.generatorCapacity !== undefined) updateData.generatorCapacity = dto.generatorCapacity ? new Decimal(dto.generatorCapacity) : null;
    if (dto.solarCapacity !== undefined) updateData.solarCapacity = dto.solarCapacity ? new Decimal(dto.solarCapacity) : null;
    if (dto.managerName !== undefined) updateData.managerName = dto.managerName;
    if (dto.managerPhone !== undefined) updateData.managerPhone = dto.managerPhone;
    if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
    if (dto.workingHours !== undefined) updateData.workingHours = dto.workingHours;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updatedStation = await this.prisma.core_stations.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        _count: { select: { children: true, stationUsers: true, journalEntries: true } },
      },
    });

    return this.formatStationResponse(updatedStation);
  }

  async remove(businessId: string, id: string): Promise<{ message: string }> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id, businessId },
      include: {
        _count: { select: { children: true, journalEntries: true } },
      },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    // Check if station has children
    if (station._count.children > 0) {
      throw new ConflictException(`لا يمكن حذف المحطة لأنها تحتوي على ${station._count.children} محطة فرعية`);
    }

    // Check if station has related entries
    if (station._count.journalEntries > 0) {
      throw new ConflictException(`لا يمكن حذف المحطة لأنها مرتبطة بـ ${station._count.journalEntries} قيد محاسبي`);
    }

    // Delete station users first
    await this.prisma.core_station_users.deleteMany({
      where: { stationId: id },
    });

    await this.prisma.core_stations.delete({
      where: { id },
    });

    return { message: 'تم حذف المحطة بنجاح' };
  }

  async getStatistics(businessId: string): Promise<StationStatisticsDto> {
    const stations = await this.prisma.core_stations.findMany({
      where: { businessId },
      include: {
        _count: { select: { stationUsers: true } },
      },
    });

    const stats: StationStatisticsDto = {
      totalStations: stations.length,
      activeStations: stations.filter(s => s.isActive).length,
      generationStations: stations.filter(s => s.type === 'generation_distribution').length,
      solarStations: stations.filter(s => s.type === 'solar').length,
      distributionStations: stations.filter(s => s.type === 'distribution_only').length,
      totalGeneratorCapacity: stations.reduce((sum, s) => sum + (s.generatorCapacity ? Number(s.generatorCapacity) : 0), 0),
      totalSolarCapacity: stations.reduce((sum, s) => sum + (s.solarCapacity ? Number(s.solarCapacity) : 0), 0),
      totalUsers: stations.reduce((sum, s) => sum + s._count.stationUsers, 0),
    };

    return stats;
  }

  async getStationsForUser(businessId: string, scopeType: string, scopeIds: any): Promise<StationResponseDto[]> {
    const where: any = { businessId, isActive: true };

    if (scopeType === 'station' && Array.isArray(scopeIds) && scopeIds.length > 0) {
      where.id = { in: scopeIds };
    }

    const stations = await this.prisma.core_stations.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { children: true, stationUsers: true } },
      },
    });

    return stations.map((station) => this.formatStationResponse(station));
  }

  private formatTreeNode(station: any): any {
    return {
      id: station.id,
      name: station.name,
      nameEn: station.nameEn,
      code: station.code,
      type: station.type,
      level: station.level,
      isActive: station.isActive,
      usersCount: station._count?.stationUsers || 0,
      entriesCount: station._count?.journalEntries || 0,
      children: station.children?.map((child: any) => this.formatTreeNode(child)) || [],
    };
  }

  private formatStationResponse(station: any): StationResponseDto {
    return {
      id: station.id,
      businessId: station.businessId,
      parentId: station.parentId,
      code: station.code,
      name: station.name,
      nameEn: station.nameEn,
      type: station.type as StationType,
      level: station.level,
      location: station.location,
      address: station.address,
      latitude: station.latitude ? Number(station.latitude) : undefined,
      longitude: station.longitude ? Number(station.longitude) : undefined,
      hasGenerators: station.hasGenerators,
      hasSolar: station.hasSolar,
      generatorCapacity: station.generatorCapacity ? Number(station.generatorCapacity) : undefined,
      solarCapacity: station.solarCapacity ? Number(station.solarCapacity) : undefined,
      managerName: station.managerName,
      managerPhone: station.managerPhone,
      contactPhone: station.contactPhone,
      contactEmail: station.contactEmail,
      workingHours: station.workingHours,
      isActive: station.isActive,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
      parent: station.parent ? {
        id: station.parent.id,
        name: station.parent.name,
        code: station.parent.code,
      } : undefined,
      childrenCount: station._count?.children,
      usersCount: station._count?.stationUsers,
      entriesCount: station._count?.journalEntries,
    };
  }
}
