import { Exclude } from 'class-transformer';
import { User } from '../auth/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Exclude({ toPlainOnly: true })
  key: string;

  @Column({ unique: true })
  url: string;

  @Column({ unique: true })
  label: string;

  @ManyToOne(() => User, (user) => user.uploads, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @Exclude({ toPlainOnly: true })
  user: User;
}
