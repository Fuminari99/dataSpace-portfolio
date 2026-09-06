/**
 * @barba/core ships type declarations but its package "types" field points at a
 * path that is not in the published tarball. Mapping it through tsconfig
 * "paths" would also redirect Vite's runtime resolution to the .d.ts and break
 * the build, so the module is declared here instead — types only.
 */
declare module '@barba/core' {
  const barba: typeof import('@barba/core/dist/src/core').default;
  export default barba;
}
