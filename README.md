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
