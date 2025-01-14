import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigationType,
  useSubmit,
} from 'react-router'
import cx from 'classnames'

import { GoPencil } from "react-icons/go"
import { BsBackspace } from "react-icons/bs"
import { RiArrowDownWideFill } from "react-icons/ri"
import { RiArrowUpWideFill } from "react-icons/ri"

import './App.css'

function KeypadButtons({ config, cols, sharedData }) {
  return config.map(b => <button
    key={b.label}
    className="keypad-button button grey"
    onClick={() => b.action(sharedData)}
    style={b.style}
  >{b.label}</button>)
}

function ListItem({ data, value, selected, onClick }) {
  return <a
    className={cx('list-item button', {
      green: value,
      blue: selected,
    })}
    onClick={() => onClick(data)}
  >
    <div className="list-item-name">{data.name}</div>
    <div className="list-item-value">{value}</div>
  </a>
}

function ListCategory({
  data,
  memory,
  selected,
  itemOnClick,
  categoryOnClick,
  active,
  setExpand,
}) {
  const ref = useRef()
  return <div
    ref={ref}
    key={data.category.id}
    className="list-category"
  >
    <div
      className={cx('list-banner-container', {
        green: data.items.some(({ id }) => memory[id]),
      })}
    >
      <button
        className="list-banner-label button"
        onClick={() => categoryOnClick(data.category)}
      >
        {data.category.name} <GoPencil style={{
          marginLeft: '0.5em' }} />
      </button>
      <button
        className="list-banner-expand button"
        onClick={() => {
          if (active)
            setExpand(null)
          else
          {
            setExpand(data.category.id)
            ref.current.scrollIntoView()
          }
        }}
      >
        {active
          ? <RiArrowUpWideFill />
          : <RiArrowDownWideFill />}
      </button>
    </div>
    {active && <div
      className={cx('list-item-container grey',
        { expand: active })}
    >
      {data.items.map(i => <ListItem
        key={i.id}
        data={i}
        value={memory[i.id]}
        selected={i == selected}
        onClick={itemOnClick}
      />)}
    </div>}
  </div>
}

function EditItemOverlay({
  data, categories, metrics, title }) {
  const navigate = useNavigate()
  const submit = useSubmit()
  const clickRef = useRef()

  return <Form
    className="form"
    action="/items"
    method="post"
    navigate={false}
    onSubmit={() => navigate(-1)}
  >
    <div className="form-header">{title}</div>
    <div className="form-label-container">
      <span className="form-label">Name</span>
      <input
        name="name"
        type="text"
        defaultValue={data.name}
        autoCapitalize="words"
      />
    </div>
    <div className="form-label-container">
      <span className="form-label">Category</span>
      <input
        name="category"
        type="text"
        defaultValue={categories[data.category]?.name}
        list="edit-item-category-options"
        autoCapitalize="words"
      />
    </div>
    <div className="form-label-container">
      <span className="form-label">Metric</span>
      <input
        name="metric"
        type="text"
        defaultValue={data.metric}
        list="edit-item-metric-options"
      />
    </div>
    <div className="form-button-container">
      {data.id && <button
        className="delete-button"
        type="button"
        onPointerDown={() => {
          clickRef.current = setTimeout(() => {
            submit({}, {
              action: `/items/${data.id}`,
              method: 'delete',
              encType: 'application/json',
              navigate: false,
            })
            navigate(-1)
          }, 1000)
        }}
        onPointerUp={
          () => clearTimeout(clickRef.current)}
      >
        Delete
      </button>}
      <button className="submit-button">Save</button>
    </div>

    <datalist id="edit-item-category-options">
      {Object.values(categories).map(({ name }) => (
        <option
          key={name}
          value={name}
        />))}
    </datalist>
    <datalist id="edit-item-category-metrics">
      {metrics.map(k => <option
        key={k}
        value={k}
      />)}
    </datalist>
  </Form>
}

function EditCategoryOverlay({ data }) {
  const navigate = useNavigate()

  return <Form
    className="form"
    action={`/categories/${data.id}`}
    method="put"
    navigate={false}
    onSubmit={() => navigate(-1)}
  >
    <div className="form-header">Edit Category</div>
    <div className="form-label-container">
      <span className="form-label">Name</span>
      <input
        name="name"
        type="text"
        defaultValue={data?.name}
        autoCapitalize="words"
      />
    </div>
    <div className="form-label-container">
      <span className="form-label">Priority</span>
      <input
        name="priority"
        type="number"
        defaultValue={data?.priority}
      />
    </div>
    <div className="form-button-container">
      <button className="submit-button">Save</button>
    </div>
  </Form>
}

function memoryDigitAction(n) {
  return (data) => {
    if (data.selected == null)
      return

    const copy = { ...data.memory }
    copy[data.selected.id] ??= ''
    copy[data.selected.id] += n
    data.setMemory(copy)
  }
}

const kpConfig = [
  ...[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => ({
      label: n,
      action: memoryDigitAction(n),
  })),
  {
    label: '0',
    action: memoryDigitAction('0'),
    style: {
      gridColumn: '1 / 3',
    },
  },
  {
    label: <BsBackspace />,
    action: (data) => {
      if (data.selected == null)
        return

      const copy = { ...data.memory }
      copy[data.selected.id] ??= ''
      copy[data.selected.id] =
        copy[data.selected.id].slice(0, -1)
      data.setMemory(copy)
    },
    style: {
      fontSize: '1.05em',
    },
  },
]

const collator = new Intl.Collator('en')

export function App() {
  const {
    items,
    categories: rawCategories,
  } = useLoaderData()

  const [memory, setMemory] = useState(() => {
    const data = localStorage.getItem('memory')
    return data ? JSON.parse(data) : {}
  })
  const [selected, setSelected] = useState()
  const [overlay, setOverlay] = useState()
  const [expand, setExpand] = useState()

  const keypadData = useMemo(() => ({
      selected,
      memory,
      setMemory: (data) => {
        localStorage.setItem('memory',
          JSON.stringify(data))
        setMemory(data)
      },
  }), [selected, memory])

  const categories = useMemo(() =>
    Object.fromEntries(
      rawCategories.map((cat) => [cat.id, cat])),
    [rawCategories])

  const metrics = useMemo(() =>
    items.flatMap(({ metric }) => metric || []),
    [items])

  const sortedItems = useMemo(() => {
    const grouped =
      Object.groupBy(items, (i) => i.category)

    return Object.entries(grouped)
      .map(([categoryId, items]) => ({
          category: categories[categoryId],
          items: items.sort(({ name: a }, { name: b }) =>
            collator.compare(a, b)),
      }))
      .sort(({ category: a }, { category: b }) =>
        (a.priority - b.priority) ||
        collator.compare(a.name, b.name))
  }, [items, categories])

  const submit = useSubmit()
  const navigate = useNavigate()

  const navType = useNavigationType()

  useEffect(() => {
    if (navType == 'POP')
      setOverlay()
  }, [navType])

  const onSubmit = useCallback(() => {
    if (!items)
      return

    submit(
      sortedItems.flatMap(({ items }) =>
        items.filter(({ id }) => memory[id]))
        .map(i =>
          ({ ...i, quantity: memory[i.id] })),
      {
        action: '/list',
        method: 'post',
        encType: 'application/json',
        navigate: false,
      })
  }, [memory])

  const itemOnClick = useCallback((data) => {
    if (selected == data)
    {
      setOverlay(<EditItemOverlay
        data={data}
        categories={categories}
        metrics={metrics}
        title={`Edit Item (id:${data.id})`}
      />)
      navigate()
    }
    else
      setSelected(data)
  }, [selected])

  const newItemOnClick = useCallback(() => {
    setOverlay(<EditItemOverlay
      data={{}}
      categories={categories}
      metrics={metrics}
      title="New Item"
    />)
    navigate()
  }, [])

  const categoryOnClick = useCallback((data) => {
    setOverlay(<EditCategoryOverlay data={data} />)
    navigate()
  }, [])

  return <>
    <div id="dial-container">
      <div id="list-container">
        <div className="list">
          {sortedItems.map((data) => <ListCategory
            key={data.category}
            data={data}
            memory={memory}
            selected={selected}
            itemOnClick={itemOnClick}
            categoryOnClick={categoryOnClick}
            active={expand == data.category.id}
            setExpand={(id) => {
              setSelected(null)
              setExpand(id)
            }}
          />)}
        </div>
        <button
          className="submit-button"
          onClick={onSubmit}
        >
          Submit
        </button>
      </div>
      <div className="status-bar-container">
        <div className="status-bar">
          <div className="status">
            {selected?.metric}
          </div>
          <button
            className="new-item-button"
            onClick={newItemOnClick}
          >
            New Item
          </button>
        </div>
      </div>
      <div className="keypad">
        <KeypadButtons
          config={kpConfig}
          cols={3}
          sharedData={keypadData}
        />
      </div>
    </div>
    <div
      className={cx('overlay', { active: overlay })}
      onClick={(ev) => {
        // Don't trigger for click events that
        // pass-through
        if (ev.target == ev.currentTarget)
          navigate(-1)
      }}
    >
      {overlay}
    </div>
  </>
}
