import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Logar } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async Logar(@Req() req, @Res() res) {
    const args: Logar = {
      login: req.body.login,
      senha: req.body.senha,
    };
    const result = await this.authService.logar(args, res);
    return res.status(200).json(result);
  }

  @Get('IsAuthenticated')
  async isAuthenticated(@Req() req, @Res() res) {
    const result = await this.authService.isAuthenticated(req);
    return res.status(200).json(result);
  }
  
  @Post('logout')
  async logout(@Req() req, @Res() res) {
    const result = await this.authService.logout(req, res);
    return res.status(200).json(result);
  }
}
