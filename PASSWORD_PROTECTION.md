# Password Protection Setup

This application includes an optional password protection feature that can be enabled for production deployments while keeping local development unrestricted.

## How It Works

The password protection system uses environment variables to control access:
- **PASSWORD_PROTECTED**: Enables/disables the password gate
- **APP_PASSWORD**: The password users must enter to access the app

## Local Development

For local development, password protection is **disabled by default**. Your `.env` file should have:

```env
PASSWORD_PROTECTED=false
APP_PASSWORD=
```

This allows you to develop and test without entering a password every time.

## Vercel Deployment

To enable password protection on Vercel:

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `PASSWORD_PROTECTED` | `true` | Production, Preview |
| `APP_PASSWORD` | `your-secure-password` | Production, Preview |
| `GEMINI_API_KEY` | `your-api-key` | Production, Preview |

### 2. Deploy Your Application

After setting the environment variables, deploy your application:

```bash
git push origin main
```

Vercel will automatically redeploy with password protection enabled.

### 3. Accessing the Application

When users visit your deployed application, they will see a password screen. They must enter the password you set in `APP_PASSWORD` to access the app.

## Updating the Password

To change the password:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Edit the `APP_PASSWORD` variable
3. Save the changes
4. Redeploy your application (or wait for the next deployment)

## Security Considerations

- **Session Storage**: Once authenticated, the session is stored in the browser's sessionStorage. Users won't need to re-enter the password until they close the browser tab.
- **No Database Required**: Passwords are stored only in environment variables, not in any database.
- **HTTPS Only**: Always use HTTPS in production to protect the password during transmission.
- **Strong Passwords**: Use a strong, unique password for production deployments.

## Disabling Password Protection

To disable password protection on Vercel:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Change `PASSWORD_PROTECTED` to `false`
3. Redeploy your application

Or simply remove the `PASSWORD_PROTECTED` environment variable entirely.

## Testing Password Protection Locally

If you want to test password protection in local development:

1. Update your `.env` file:
   ```env
   PASSWORD_PROTECTED=true
   APP_PASSWORD=test123
   ```

2. Restart your development server:
   ```bash
   npm run start:dev
   ```

3. Visit `http://localhost:4200` and you'll see the password screen

4. Enter `test123` to access the app

## Troubleshooting

### Password screen doesn't appear on Vercel
- Check that `PASSWORD_PROTECTED` is set to `true` in Vercel environment variables
- Verify the environment variables are set for the correct environment (Production/Preview)
- Check the browser console for any configuration loading errors

### Password is not working
- Verify `APP_PASSWORD` is set correctly in Vercel (no extra spaces)
- Check that you're entering the exact password (case-sensitive)
- Clear your browser's sessionStorage and try again

### Password screen appears on localhost
- Check your `.env` file - `PASSWORD_PROTECTED` should be `false` for local development
- Restart your development server after changing `.env`
- Clear your browser's sessionStorage

## Architecture

The password protection system consists of:

1. **PasswordGateComponent**: The UI component that displays the password input screen
2. **AuthService**: Manages authentication state and password validation
3. **ConfigService**: Loads password protection settings from the API
4. **API Endpoint** (`/api/config`): Serves environment variables to the frontend

The password is validated on the client side, and authentication state is stored in sessionStorage for the duration of the browser session.
