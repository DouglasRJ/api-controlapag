import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashService } from 'src/common/hash/hash.service';
import { ManageFileService } from 'src/common/manageFile/manageFile.service';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashService: HashService,
    private readonly manageFile: ManageFileService,
  ) {}

  async findOneByOrFail(userData: Partial<User>) {
    const user = await this.userRepository.findOne({
      where: userData,
      relations: ['providerProfile', 'clientProfile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(
    createUserDto: CreateUserDto,
    transactionalEntityManager?: EntityManager,
  ) {
    const hashedPassword = await this.hashService.hash(createUserDto.password);

    const userData = {
      email: createUserDto.email,
      username: createUserDto.username,
      password: hashedPassword,
      role: createUserDto.role,
    };

    if (transactionalEntityManager) {
      const exists = await transactionalEntityManager.exists(User, {
        where: { email: createUserDto.email },
      });
      if (exists) {
        throw new ConflictException('Email already exists');
      }
      const user = transactionalEntityManager.create(User, userData);
      return transactionalEntityManager.save(user);
    } else {
      const exists = await this.userRepository.exists({
        where: { email: createUserDto.email },
      });
      if (exists) {
        throw new ConflictException('Email already exists');
      }
      const user = this.userRepository.create(userData);
      return this.userRepository.save(user);
    }
  }

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: string) {
    return this.findOneByOrFail({ id });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!updateUserDto.username) {
      throw new BadRequestException('Data not sent');
    }

    const user = await this.findOneByOrFail({ id });

    user.username = updateUserDto.username ?? user.username;

    const updated = await this.userRepository.save(user);
    return updated;
  }

  async updatePassword(id: string, updateUserDto: UpdatePasswordDto) {
    const user = await this.findOneByOrFail({ id });

    const isCurrentPasswordValid = await this.hashService.compare(
      updateUserDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password invalid');
    }

    user.password = await this.hashService.hash(updateUserDto.newPassword);

    const updated = await this.userRepository.save(user);
    return updated;
  }

  async remove(id: string) {
    const user = await this.findOneByOrFail({ id });
    await this.userRepository.delete(user);

    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.findOneByOrFail({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const AVATAR_PATH = '/users/avatars/';
    const key = `${AVATAR_PATH}${file.fieldname}${Date.now()}`;

    const fileUrl = await this.manageFile.uploadFile(file, key);

    user.image = fileUrl;

    const updated = await this.userRepository.save(user);
    return updated;
  }
}
