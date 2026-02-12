import { ArgumentsHost, Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { DomainException } from '../domain/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements GqlExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    return new GraphQLError(exception.message, {
      extensions: {
        code: exception.code,
      },
    });
  }
}
