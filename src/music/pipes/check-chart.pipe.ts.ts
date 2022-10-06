import { BadRequestException, PipeTransform } from '@nestjs/common';

export class CheckChartPipe implements PipeTransform {
  transform(chart?: string) {
    if (chart === 'newrelease' || chart === 'trend') {
      return chart;
    }

    throw new BadRequestException(
      `Query "chart" must be included and must be 'trend' or 'newrelease'.`,
    );
  }
}
