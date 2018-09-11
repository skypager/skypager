export default async function mimeTypes(chain) {
  return chain.invoke("fileManager.files.values").map(file => file.mime && file.mime.mimeType).uniq()
}
