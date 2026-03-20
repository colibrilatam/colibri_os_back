import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { AuthProvider } from "src/users/entities/user.entity";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
    constructor(configService: ConfigService){
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
            scope: ['profile', 'email']
        });
    }
    
    validate(accessToken: string, refreshToken: string, profile: Profile): any {
        return {
            email: profile.emails![0].value,
            fullName: profile.displayName,
            googleId: profile.id,
            avatar: profile.photos![0].value,
            provider: AuthProvider.GOOGLE
        }
    }
}