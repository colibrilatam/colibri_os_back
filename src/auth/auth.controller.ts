import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "./dto/create.dto";
import type { Response } from "express";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @UseGuards(AuthGuard('google'))
    @Get('google')
    async getGoogle () {}

    @UseGuards(AuthGuard('google'))
    @Get('google/callback')
    async getGoogleCallback (@Req() req: any, @Res() res: Response){
        const result = await this.authService.googleLogin(req.user);
        res.redirect(`${process.env.FRONTEND_URL}/login/google-callback`)
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