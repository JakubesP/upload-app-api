import { Exclude } from 'class-transformer';
import { Upload } from '../uploads/upload.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @OneToMany(() => Upload, (upload) => upload.user, { eager: true })
  @Exclude({ toPlainOnly: true })
  uploads: Upload[];
}
