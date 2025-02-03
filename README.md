# Secario labs static website

## Blog posts

### Captions

#### Images

You can add captions under images, like so:

```markdown
![](/assets/images/posts/image.png)
_Figure 1 - Caption for the image_
```

**Pattern:** The caption text should be between undercores and directly below the image line (no empty lines between them)

#### Code blocks

You can add captions under code blocks, like so:

`````markdown
```python
print('Hello')
```
_Caption for the code block_
`````

**Pattern:** The caption text should be between undercores and below the code block (the lines (if any) between them do not make a difference)

#### Tables

You can add captions under tables, like so:

```markdown
|Heading|Heading|Heading|
|-------|-------|-------|
|cell   |cell   |cell   |
|cell   |cell   |cell   |

_Table Caption_
```

**Pattern:** The caption text should be between undercores and below the image line (there should be an empty line between them)

#### Responsive tables

If you want the table to scroll horizontally in case the table is wider than the screen, then the table should be inside a `div` with a class of `table-responsive`. In this case, the table should be written in HTML. For example:

```markdown
<div class="table-responsive">
<table>
  <thead>
    <tr>
      <th>Heading</th>
      <th>Heading</th>
      <th>Heading</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>cell</td>
      <td>cell</td>
      <td>cell</td>
    </tr>
    <tr>
      <td>cell</td>
      <td>cell</td>
      <td>cell</td>
    </tr>
  </tbody>
</table>
</div>
_Responsive table caption_
```

**Patern:** The caption text should be between undercores and below the `<div>` (the lines (if any) between them do not make a difference)

## Code snippets

### Switch zebra stripes off

Taking advantage of the fact that Jekyll uses Kramdown for parsing markdown, we can inject custom classes into the code blocks.

So in order to switch the zebra stripes off, just add `{: .no-styles}` right before the beginning of the code snippet. Do not leave empty lines between them.

For example:

`````
{: .no-stripes}
```bash
user@ubuntu:~/poc$ clear
user@ubuntu:~/poc$ ls -l
```
`````

### Mark code lines

You can add yellow marking to code lines, by using the `data-lines` attribute.

For instance, you mark line 1, like so:

`````
{:data-line="1"}
```bash
user@ubuntu:~/poc$ clear
user@ubuntu:~/poc$ ls -l
```
`````

You can mark multilple lines, i.e. the first two, like so:

`````
{:data-line="1-2"}
```bash
user@ubuntu:~/poc$ clear
user@ubuntu:~/poc$ ls -l
```
`````

Or you can mark lines 1 and 3:

`````
{:data-line="1,3"}
```bash
user@ubuntu:~/poc$ clear
user@ubuntu:~/poc$ ls -l
user@ubuntu:~/poc$ touch config.txt
```
`````

Or you can mark lines 1 through 3, line 5 and lines 7 through 10:

`````
{:data-line="1-3,5,7-10"}
```bash
user@ubuntu:~/poc$ clear
user@ubuntu:~/poc$ ls -l
user@ubuntu:~/poc$ touch file.txt
```
`````

You can even mix and match and highlight lines without having zebra styles:

`````
{: .no-stripes data-line="1,3"}
```bash
user@ubuntu:~/poc$ clear
user@ubuntu:~/poc$ ls -l
user@ubuntu:~/poc$ touch config.txt
```