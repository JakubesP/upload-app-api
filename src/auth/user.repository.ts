import { DBSavedStatus } from '../created-status.enum';
import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async createUser(
    email: string,
    password: string,
  ): Promise<[DBSavedStatus, User]> {
    const user = this.create({ email, password });
    try {
      await this.save(user);
      return [DBSavedStatus.SUCCESS, user];
    } catch (error) {
      if (error.code === '23505') {
        return [DBSavedStatus.CONFLICT, null];
      }
      return [DBSavedStatus.ERROR, null];
    }
  }
}
