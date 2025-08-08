# TODO:

- [x] 39: Modificar auth-response.type.ts para hacer refreshToken nullable con @Field({ nullable: true }) (priority: High)
- [x] 40: Corregir método register en auth.service.ts para usar userData.refreshToken || null (priority: High)
- [x] 42: Corregir el tipo explícito del campo refreshToken en AuthResponse usando @Field(() => String, { nullable: true }) (priority: High)
- [x] 41: Ejecutar tests para verificar que la corrección funciona (priority: Medium)
- [x] 43: Ejecutar tests y verificar que la aplicación inicia correctamente (priority: Medium)
