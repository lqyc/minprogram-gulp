module.exports = options => `
w-loading(id="w-loading")
w-page(
    class="w-page"
)
    view(slot="header" class="header")
    view(slot="content" class="content")
        text {{title}}
    view(slot="footer" class="footer")
`





    