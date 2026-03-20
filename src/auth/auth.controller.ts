import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "./dto/create.dto";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @UseGuards(AuthGuard('google'))
    @Get('google')
    async getGoogle () {}

    @UseGuards(AuthGuard('google'))
    @Get('google/callback')
    async getGoogleCallback (@Req() req: any){
        return await this.authService.googleLogin(req.user);
    }

    @Post('signin')
    async loginUser(@Body() logindto: LoginDto){
        return await this.authService.loginUser(logindto)
    }

    @Post('signup')
    async createUser(@Body() user: CreateUserDto){
        return await this.authService.createUser(user)
    }
}