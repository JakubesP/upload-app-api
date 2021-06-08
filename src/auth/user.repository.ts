import { CreatedStatus } from '../created-status.enum';
import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async createUser(
    email: string,
    password: string,
  ): Promise<[CreatedStatus, User]> {
    const user = this.create({ email, password });
    try {
      await this.save(user);
      return [CreatedStatus.SUCCESS, user];
    } catch (error) {
      if (error.code === '23505') {
        return [CreatedStatus.CONFLICT, null];
      }
      return [CreatedStatus.ERROR, null];
    }
  }
}
