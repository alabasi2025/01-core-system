import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto, StationResponseDto, PaginatedStationsDto, StationType } from './dto';
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

    const station = await this.prisma.core_stations.create({
      data: {
        businessId,
        name: dto.name,
        nameEn: dto.nameEn,
        type: dto.type || 'generation_distribution',
        location: dto.location,
        latitude: dto.latitude ? new Decimal(dto.latitude) : null,
        longitude: dto.longitude ? new Decimal(dto.longitude) : null,
        hasGenerators: dto.hasGenerators || false,
        hasSolar: dto.hasSolar || false,
      },
    });

    return this.formatStationResponse(station);
  }

  async findAll(businessId: string, query: StationQueryDto): Promise<PaginatedStationsDto> {
    const { search, type, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [stations, total] = await Promise.all([
      this.prisma.core_stations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    return this.formatStationResponse(station);
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

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude ? new Decimal(dto.latitude) : null;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude ? new Decimal(dto.longitude) : null;
    if (dto.hasGenerators !== undefined) updateData.hasGenerators = dto.hasGenerators;
    if (dto.hasSolar !== undefined) updateData.hasSolar = dto.hasSolar;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updatedStation = await this.prisma.core_stations.update({
      where: { id },
      data: updateData,
    });

    return this.formatStationResponse(updatedStation);
  }

  async remove(businessId: string, id: string): Promise<{ message: string }> {
    const station = await this.prisma.core_stations.findFirst({
      where: { id, businessId },
    });

    if (!station) {
      throw new NotFoundException('المحطة غير موجودة');
    }

    // Check if station has related data
    const relatedEntries = await this.prisma.core_journal_entries.count({
      where: { stationId: id },
    });

    if (relatedEntries > 0) {
      throw new ConflictException(`لا يمكن حذف المحطة لأنها مرتبطة بـ ${relatedEntries} قيد محاسبي`);
    }

    await this.prisma.core_stations.delete({
      where: { id },
    });

    return { message: 'تم حذف المحطة بنجاح' };
  }

  async getStationsForUser(businessId: string, scopeType: string, scopeIds: any): Promise<StationResponseDto[]> {
    let where: any = { businessId, isActive: true };

    if (scopeType === 'station' && Array.isArray(scopeIds) && scopeIds.length > 0) {
      where.id = { in: scopeIds };
    }

    const stations = await this.prisma.core_stations.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return stations.map((station) => this.formatStationResponse(station));
  }

  private formatStationResponse(station: any): StationResponseDto {
    return {
      id: station.id,
      businessId: station.businessId,
      name: station.name,
      nameEn: station.nameEn,
      type: station.type as StationType,
      location: station.location,
      latitude: station.latitude ? Number(station.latitude) : undefined,
      longitude: station.longitude ? Number(station.longitude) : undefined,
      hasGenerators: station.hasGenerators,
      hasSolar: station.hasSolar,
      isActive: station.isActive,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
    };
  }
}
