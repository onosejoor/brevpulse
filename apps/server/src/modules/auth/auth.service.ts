import { Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '@repo/shared-types/globals';
import { ApiResDTO } from 'src/dtos/api.response.dto';
import { CreateUserDto, SigninUserDTO } from 'src/dtos/auth.dto';

@Injectable()
export class AuthService {
  private users = [
    {
      id: '111-111-111-111',
      name: 'Onos Ejoor',
      email: 'onosejoor14@gmail.com',
      password: '11111111111111',
    },
  ];

  getUsers(): (typeof this.users)[0] {
    return this.users[0];
  }

  async createUser(dto: CreateUserDto): Promise<ApiResDTO> {
    const newUser = {
      id: `${this.users.length + 1 + Date.now()}`,
      ...dto,
    };

    this.users.push(newUser);

    const res = await Promise.resolve({
      status: 'success' as Status,
      message: `Welcome To Brevpulse, ${newUser.name}`,
    });

    return res;
  }

  signinUser(dto: SigninUserDTO): ApiResDTO {
    const user = this.users.find((d) => d.email === dto.email);

    if (!user) {
      throw new NotFoundException('Invalid Credentials');
    }

    if (user.password !== dto.password) {
      throw new NotFoundException('Invalid Credentials');
    }

    const { password, ...safeUser } = user;

    return {
      status: 'success',
      data: safeUser,
      message: `Welcome ${user.name}`,
    };
  }
}
