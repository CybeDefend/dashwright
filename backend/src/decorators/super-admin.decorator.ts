import { SetMetadata } from "@nestjs/common";

export const SUPER_ADMIN_KEY = "isSuperAdmin";
export const SuperAdmin = () => SetMetadata(SUPER_ADMIN_KEY, true);
